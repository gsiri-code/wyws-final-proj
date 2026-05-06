import { NextRequest, NextResponse } from "next/server";
import { withAuthenticatedDb } from "@/lib/api/auth";
import { jsonError, parseJson } from "@/lib/api/http";
import { updateDiaryDay } from "@/lib/api/sleep-diary";
import { updateDiaryDaySchema } from "@/lib/api/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]/days/[dayId]">
) {
  try {
    const { diaryId, dayId } = await context.params;
    const input = await parseJson(request, updateDiaryDaySchema);
    const result = await withAuthenticatedDb(request, async (db, userId) =>
      updateDiaryDay(db, diaryId, dayId, userId, input)
    );

    return NextResponse.json({ day: result });
  } catch (error) {
    return jsonError(error);
  }
}
