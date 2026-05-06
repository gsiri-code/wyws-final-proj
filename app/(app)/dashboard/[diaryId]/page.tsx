import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AasmDashboard } from "@/components/diary/aasm/AasmDashboard";
import { withCurrentUserDb } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { getDiaryById, recalculateDiaryMetrics } from "@/lib/api/sleep-diary";

export const metadata: Metadata = {
  title: "Diary",
  description: "Review and edit your Sleepbook 7-day diary.",
};

export default async function DiaryEditorPage({
  params,
}: {
  params: Promise<{ diaryId: string }>;
}) {
  const { diaryId } = await params;

  const initialDiary = await withCurrentUserDb(async (db, userId) => {
    try {
      const diary = await getDiaryById(db, diaryId, userId);
      const metrics = await recalculateDiaryMetrics(db, diaryId, userId);
      return JSON.parse(JSON.stringify({ ...diary, metrics }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  });

  if (!initialDiary) {
    notFound();
  }

  return <AasmDashboard initialDiary={initialDiary} />;
}
