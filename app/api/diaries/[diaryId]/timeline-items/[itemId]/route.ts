import { NextRequest, NextResponse } from "next/server";
import { withAuthenticatedDb } from "@/lib/api/auth";
import { jsonError, parseJson } from "@/lib/api/http";
import { deleteTimelineItem, updateTimelineItem } from "@/lib/api/sleep-diary";
import { updateTimelineItemSchema } from "@/lib/api/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]/timeline-items/[itemId]">
) {
  try {
    const { diaryId, itemId } = await context.params;
    const input = await parseJson(request, updateTimelineItemSchema);
    const result = await withAuthenticatedDb(request, async (db, userId) =>
      updateTimelineItem(db, diaryId, itemId, userId, input)
    );

    return NextResponse.json({ timelineItem: result });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]/timeline-items/[itemId]">
) {
  try {
    const { diaryId, itemId } = await context.params;
    const result = await withAuthenticatedDb(request, async (db, userId) =>
      deleteTimelineItem(db, diaryId, itemId, userId)
    );

    return NextResponse.json({ deleted: result });
  } catch (error) {
    return jsonError(error);
  }
}
