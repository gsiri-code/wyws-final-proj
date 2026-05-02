import { NextRequest, NextResponse } from "next/server";
import { withAuthenticatedDb } from "@/lib/api/auth";
import { jsonError } from "@/lib/api/http";
import { recalculateDiaryMetrics } from "@/lib/api/sleep-diary";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]/metrics">
) {
  try {
    const { diaryId } = await context.params;
    const result = await withAuthenticatedDb(request, async (db, userId) =>
      recalculateDiaryMetrics(db, diaryId, userId)
    );

    return NextResponse.json({ metrics: result });
  } catch (error) {
    return jsonError(error);
  }
}

export const POST = GET;
