import type { Metadata } from "next";
import { DiaryManagerDashboard } from "@/components/diary/DiaryManagerDashboard";
import { withCurrentUserDb } from "@/lib/api/auth";
import { listDiaries } from "@/lib/api/sleep-diary";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage and open your Sleepbook diaries.",
};

export default async function DashboardPage() {
  const diaries = await withCurrentUserDb(async (db, userId) => listDiaries(db, userId));
  const initialDiaries = JSON.parse(JSON.stringify(diaries));

  return <DiaryManagerDashboard initialDiaries={initialDiaries} />;
}
