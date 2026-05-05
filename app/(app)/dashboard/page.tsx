import type { Metadata } from "next";
import { AasmDashboard } from "@/components/diary/aasm/AasmDashboard";
import { withCurrentUserDb } from "@/lib/api/auth";
import { getDiaryById, listDiaries, recalculateDiaryMetrics } from "@/lib/api/sleep-diary";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Review and edit your Sleepbook 7-day AASM diary.",
};

export default async function DashboardPage() {
  const initialDiary = await withCurrentUserDb(async (db, userId) => {
    const diaries = await listDiaries(db);
    const latestDiary = diaries[0];

    if (!latestDiary) return null;

    const diary = await getDiaryById(db, latestDiary.id);
    const metrics = await recalculateDiaryMetrics(db, latestDiary.id, userId);

    return JSON.parse(JSON.stringify({ ...diary, metrics }));
  });

  return <AasmDashboard initialDiary={initialDiary} />;
}
