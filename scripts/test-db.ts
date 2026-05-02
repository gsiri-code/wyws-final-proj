import "dotenv/config";
import { sql } from "drizzle-orm";
import { client, db } from "../utils/db-client";

async function main() {
  try {
    const now = await db.execute<{ now: string; role: string }>(sql`
      select now()::text as now, current_user as role
    `);
    console.log("Database connection OK");
    console.log("Server time:", now[0]?.now);
    console.log("Database role:", now[0]?.role);

    const claim = await db.execute<{ sub: string | null; jwtRole: string | null }>(sql`
      select
        current_setting('request.jwt.claim.sub', true) as sub,
        current_setting('request.jwt.claim.role', true) as jwt_role
    `);
    console.log("Current JWT claims:", claim[0] ?? null);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("Database test failed:", error);
  process.exit(1);
});
