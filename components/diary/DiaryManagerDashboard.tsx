"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createDiary,
  deleteDiary,
  type DiaryDetail,
  type DiarySummary,
} from "@/lib/api/diaries-client";
import { isDiaryWeekCompletedForExport } from "@/lib/diary/diary-export-eligibility";

interface DiaryManagerDashboardProps {
  initialDiaries: DiarySummary[];
}

export function DiaryManagerDashboard({ initialDiaries }: DiaryManagerDashboardProps) {
  const [diaries, setDiaries] = React.useState(initialDiaries);
  const [startDate, setStartDate] = React.useState(getTodayDateInput());
  const [creating, setCreating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCreateDiary(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const { diary } = await createDiary(startDate);
      setDiaries((current) =>
        sortDiaries([toDiarySummary(diary), ...current.filter((entry) => entry.id !== diary.id)])
      );
      toast.success("Diary created.");
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Failed to create diary.";
      setError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteDiary(diary: DiarySummary) {
    if (!window.confirm(`Delete diary ${formatDateRange(diary.startDate, diary.endDate)}? This cannot be undone.`)) {
      return;
    }

    const snapshot = diaries;
    setDeletingId(diary.id);
    setError(null);
    setDiaries((current) => current.filter((entry) => entry.id !== diary.id));

    try {
      await deleteDiary(diary.id);
      toast.success("Diary deleted.");
    } catch (nextError) {
      setDiaries(snapshot);
      const message = nextError instanceof Error ? nextError.message : "Failed to delete diary.";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-600">Sleepbook</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-slate-950">Diaries</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Create, review, and manage your 7-day diary weeks.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Create diary</h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateDiary}>
          <input
            type="date"
            value={startDate}
            max={getTodayDateInput()}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-11 flex-1 rounded-2xl border border-slate-300 px-4 text-sm"
            required
          />
          <Button type="submit" size="lg" isLoading={creating}>
            Create 7-day diary
          </Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Start date can be today or in the past. Ranges cannot overlap existing diaries.</p>
      </section>

      <section className="grid gap-4">
        {diaries.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
            No diaries yet. Create your first 7-day diary above.
          </div>
        ) : (
          diaries.map((diary) => (
            <article key={diary.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{formatDateRange(diary.startDate, diary.endDate)}</p>
                  <p className="mt-1 text-sm text-slate-600">Created {formatDate(diary.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/${diary.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-sm font-medium text-white transition hover:bg-black/90"
                  >
                    Open diary
                  </Link>
                  <Link
                    href={`/dashboard/${diary.id}/metrics`}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-slate-100 px-3 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
                  >
                    Metrics
                  </Link>
                  {isDiaryWeekCompletedForExport(diary.endDate) ? (
                    <a
                      href={`/api/diaries/${diary.id}/export/weekly`}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-slate-100 px-3 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
                    >
                      Export PDF
                    </a>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    isLoading={deletingId === diary.id}
                    onClick={() => void handleDeleteDiary(diary)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function toDiarySummary(diary: DiaryDetail): DiarySummary {
  return {
    id: diary.id,
    startDate: diary.startDate,
    endDate: diary.endDate,
    createdAt: diary.createdAt,
    updatedAt: diary.updatedAt,
  };
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return `${formatter.format(new Date(`${startDate}T00:00:00.000Z`))} — ${formatter.format(new Date(`${endDate}T00:00:00.000Z`))}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function sortDiaries(diaries: DiarySummary[]) {
  return [...diaries].sort((left, right) => right.startDate.localeCompare(left.startDate));
}

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}
