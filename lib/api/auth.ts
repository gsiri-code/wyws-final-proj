import { sql } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { db as rootDb } from "@/utils/db-client";
import type { AppDb } from "@/lib/api/db";
import { ApiError } from "@/lib/api/http";

const userIdSchema = z.string().trim().min(1).max(128);

export function getRequestUserId(request: NextRequest) {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    throw new ApiError("Missing x-user-id header", 401);
  }

  return userIdSchema.parse(userId);
}

export async function withAuthenticatedDb<T>(
  request: NextRequest,
  callback: (db: AppDb, userId: string) => Promise<T>
) {
  const userId = getRequestUserId(request);

  return rootDb.transaction(async (transactionDb) => {
    await transactionDb.execute(sql`
      select
        set_config('request.jwt.claim.sub', ${userId}, true),
        set_config('request.jwt.claim.role', 'authenticated', true)
    `);

    return callback(transactionDb as unknown as AppDb, userId);
  });
}
