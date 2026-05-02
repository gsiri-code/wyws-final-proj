import { NextRequest, NextResponse } from "next/server";
import { withAuthenticatedDb } from "@/lib/api/auth";
import { jsonError, parseJson } from "@/lib/api/http";
import { createTimelineItem, listTimelineItems } from "@/lib/api/sleep-diary";
import { createTimelineItemSchema } from "@/lib/api/validation";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]/timeline-items">
) {
  try {
    const { diaryId } = await context.params;
    const result = await withAuthenticatedDb(request, async (db) => listTimelineItems(db, diaryId));
    return NextResponse.json({ timelineItems: result });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]/timeline-items">
) {
  try {
    const { diaryId } = await context.params;
    const input = await parseJson(request, createTimelineItemSchema);
    const result = await withAuthenticatedDb(request, async (db, userId) =>
      createTimelineItem(db, userId, diaryId, input)
    );

    return NextResponse.json({ timelineItem: result }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
