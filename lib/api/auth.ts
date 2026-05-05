import type { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import type { AppDb } from "@/lib/api/db";
import { ApiError } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";

export async function getRequestUserId() {
  const supabaseClient = await createClient();
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) throw new ApiError("Unauthorized", 401);

  return user.id;
}

export async function isUserAuthenticated(): Promise<boolean> {
  try {
    await getRequestUserId();
    return true;
  } catch {
    return false;
  }
}

export async function withAuthenticatedDb<T>(
  request: NextRequest,
  fn: (db: AppDb, userId: string) => Promise<T>
): Promise<T> {
  const userId = await getRequestUserId();

  const { db } = await import("@/utils/db-client");

  return db.transaction(async (tx) => {
    await tx.execute(sql`
      select
        set_config('request.jwt.claim.sub', ${userId}, true),
        set_config('request.jwt.claim.role', 'authenticated', true)
    `);

    return fn(tx as unknown as AppDb, userId);
  });
}
