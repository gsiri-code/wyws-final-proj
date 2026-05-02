import { NextRequest, NextResponse } from "next/server";
import { withAuthenticatedDb } from "@/lib/api/auth";
import { jsonError } from "@/lib/api/http";
import { getDiaryById } from "@/lib/api/sleep-diary";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/diaries/[diaryId]">
) {
  try {
    const { diaryId } = await context.params;
    const result = await withAuthenticatedDb(request, async (db) => getDiaryById(db, diaryId));
    return NextResponse.json({ diary: result });
  } catch (error) {
    return jsonError(error);
  }
}
