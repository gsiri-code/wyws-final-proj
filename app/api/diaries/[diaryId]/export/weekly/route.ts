import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { withAuthenticatedDb } from "@/lib/api/auth";
import { ApiError, jsonError } from "@/lib/api/http";
import { getDiaryById, recalculateDiaryMetrics } from "@/lib/api/sleep-diary";
import { isDiaryWeekCompletedForExport } from "@/lib/diary/diary-export-eligibility";
import { formatWeeklyExport } from "@/lib/diary/weekly-export";
import { WeeklyDiaryDocument } from "@/lib/pdf/WeeklyDiaryDocument";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]/export/weekly">
) {
  try {
    const { diaryId } = await context.params;
    const { diary, metrics } = await withAuthenticatedDb(request, async (db, userId) => {
      const diaryResult = await getDiaryById(db, diaryId, userId);

      if (!isDiaryWeekCompletedForExport(diaryResult.endDate)) {
        throw new ApiError("Weekly diary PDF is only available after the diary week is complete.", 403);
      }

      const metricResult = await recalculateDiaryMetrics(db, diaryId, userId);

      return {
        diary: diaryResult,
        metrics: metricResult,
      };
    });

    const exportData = formatWeeklyExport({ diary, metrics });
    const pdfBuffer = await renderToBuffer(WeeklyDiaryDocument({ data: exportData }));
    const fileName = getExportFileName(diary.startDate, diary.endDate);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

function getExportFileName(startDate: string, endDate: string) {
  return `sleepbook-${startDate}-${endDate}.pdf`;
}
