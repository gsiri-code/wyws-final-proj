import { NextRequest, NextResponse } from "next/server";
import { withAuthenticatedDb } from "@/lib/api/auth";
import { jsonError } from "@/lib/api/http";
import { deleteDiary, getDiaryById } from "@/lib/api/sleep-diary";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]">
) {
  try {
    const { diaryId } = await context.params;
    const result = await withAuthenticatedDb(request, async (db, userId) =>
      getDiaryById(db, diaryId, userId)
    );
    return NextResponse.json({ diary: result });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]">
) {
  try {
    const { diaryId } = await context.params;
    const result = await withAuthenticatedDb(request, async (db, userId) =>
      deleteDiary(db, diaryId, userId)
    );

    return NextResponse.json({ deleted: result });
  } catch (error) {
    return jsonError(error);
  }
}
