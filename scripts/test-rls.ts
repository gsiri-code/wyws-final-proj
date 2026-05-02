import "dotenv/config";
import { sql } from "drizzle-orm";
import { client, db } from "../utils/db-client";

const OWNER_ID = "rls-owner-test";
const STRANGER_ID = "rls-stranger-test";
const OWNER_EMAIL = "rls-owner@example.com";
const STRANGER_EMAIL = "rls-stranger@example.com";

type Row = { id: string };
type JwtClaims = { sub: string; role: string } | null;

function logStep(message: string) {
  console.log(`\n=== ${message} ===`);
}

async function setJwtSub(userId: string) {
  await db.execute(sql`
    select
      set_config('request.jwt.claim.sub', ${userId}, true),
      set_config('request.jwt.claim.role', 'authenticated', true)
  `);
}

async function getJwtClaims(): Promise<JwtClaims> {
  const result = await db.execute<{ sub: string; role: string }>(sql`
    select
      current_setting('request.jwt.claim.sub', true) as sub,
      current_setting('request.jwt.claim.role', true) as role
  `);

  return result[0] ?? null;
}

async function ensureUser(id: string, email: string) {
  await db.execute(sql`
    insert into users (id, email, password_hash, name)
    values (${id}, ${email}, 'test-hash', 'RLS Test User')
    on conflict (id) do update
    set email = excluded.email
  `);
}

async function createDiaryForCurrentUser(userId: string) {
  const result = await db.execute<Row>(sql`
    insert into diaries (user_id, start_date, end_date)
    values (${userId}, '2026-05-01', '2026-05-14')
    returning id
  `);

  return result[0]?.id;
}

async function selectVisibleDiaries() {
  return db.execute<{ id: string; user_id: string }>(sql`
    select id, user_id
    from diaries
    order by created_at desc
  `);
}

async function expectInsertDenied(userId: string) {
  try {
    await db.execute(sql`
      insert into diaries (user_id, start_date, end_date)
      values (${userId}, '2026-06-01', '2026-06-14')
    `);
    console.log("FAIL: insert unexpectedly succeeded");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log("PASS: insert denied as expected");
    console.log(message);
  }
}

async function main() {
  try {
    logStep("RLS test setup");
    await setJwtSub(OWNER_ID);
    console.log("JWT claims:", await getJwtClaims());
    await ensureUser(OWNER_ID, OWNER_EMAIL);

    await setJwtSub(STRANGER_ID);
    console.log("JWT claims:", await getJwtClaims());
    await ensureUser(STRANGER_ID, STRANGER_EMAIL);
    console.log("Created test users");

    await setJwtSub(OWNER_ID);

    logStep("Owner can insert own diary");
    const diaryId = await createDiaryForCurrentUser(OWNER_ID);
    console.log("Inserted diary id:", diaryId);

    logStep("Owner can see own diaries");
    const ownerRows = await selectVisibleDiaries();
    console.log(ownerRows);

    logStep("Owner cannot insert stranger-owned diary");
    await expectInsertDenied(STRANGER_ID);

    logStep("Stranger cannot see owner's diary");
    await setJwtSub(STRANGER_ID);
    console.log("JWT claims:", await getJwtClaims());
    const strangerRows = await selectVisibleDiaries();
    console.log(strangerRows);

    logStep("Stranger cannot update owner's diary");
    try {
      const result = await db.execute(sql`
        update diaries
        set updated_at = now()
        where id = ${diaryId}
      `);
      console.log(result);
      console.log("If rowCount is 0, RLS blocked the update.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("PASS: update denied as expected");
      console.log(message);
    }

    logStep("Cleanup");
    await setJwtSub(OWNER_ID);
    await db.execute(sql`delete from diaries where user_id = ${OWNER_ID}`);
    await db.execute(sql`delete from users where id = ${OWNER_ID}`);

    await setJwtSub(STRANGER_ID);
    await db.execute(sql`delete from diaries where user_id = ${STRANGER_ID}`);
    await db.execute(sql`delete from users where id = ${STRANGER_ID}`);
    console.log("Cleanup complete");

    console.log("\nRLS test finished.");
    console.log("Note: this only proves RLS if your DB role does not bypass RLS.");
    console.log("Expected results:");
    console.log("- owner insert succeeds");
    console.log("- owner select returns their diary");
    console.log("- cross-user insert is denied");
    console.log("- stranger select returns []");
    console.log("- stranger update affects 0 rows or errors");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("RLS test failed:", error);
  process.exit(1);
});
