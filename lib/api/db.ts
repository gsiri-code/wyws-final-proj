import { db as rootDb } from "@/utils/db-client";

export type AppDb = Pick<
  typeof rootDb,
  "select" | "insert" | "update" | "delete" | "execute" | "transaction"
>;
