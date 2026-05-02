import { NextRequest, NextResponse } from "next/server";
import { withAuthenticatedDb } from "@/lib/api/auth";
import { jsonError, parseJson } from "@/lib/api/http";
import { createDiary, listDiaries } from "@/lib/api/sleep-diary";
import { createDiarySchema } from "@/lib/api/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const result = await withAuthenticatedDb(request, async (db) => listDiaries(db));
    return NextResponse.json({ diaries: result });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await parseJson(request, createDiarySchema);
    const result = await withAuthenticatedDb(request, async (db, userId) =>
      createDiary(db, userId, input)
    );

    return NextResponse.json({ diary: result }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
