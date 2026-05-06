import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withCurrentUserDb } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { getDiaryById, recalculateDiaryMetrics } from "@/lib/api/sleep-diary";

export const metadata: Metadata = {
  title: "Weekly metrics",
  description: "Review weekly sleep metrics for the selected diary.",
};

export default async function DiaryMetricsPage({
  params,
}: {
  params: Promise<{ diaryId: string }>;
}) {
  const { diaryId } = await params;

  const payload = await withCurrentUserDb(async (db, userId) => {
    try {
      const diary = await getDiaryById(db, diaryId, userId);
      const metrics = await recalculateDiaryMetrics(db, diaryId, userId);
      return JSON.parse(JSON.stringify({ diary, metrics }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }
  });

  if (!payload) {
    notFound();
  }

  const currentMetric = payload.metrics.find(
    (metric: { diaryWeekId: string }) => metric.diaryWeekId === payload.diary.weeks[0]?.id
  ) ?? payload.metrics[0] ?? null;

  const cards = [
    ["Avg Bedtime", currentMetric?.averageBedtime ? formatClock(currentMetric.averageBedtime) : "—"],
    ["Avg Wake", currentMetric?.averageWakeTime ? formatClock(currentMetric.averageWakeTime) : "—"],
    ["Avg Sleep Duration", currentMetric?.averageTotalSleepTimeMinutes ? formatHours(Number(currentMetric.averageTotalSleepTimeMinutes)) : "—"],
    ["Avg Sleep Latency", currentMetric?.averageSleepLatencyMinutes ? `${Math.round(Number(currentMetric.averageSleepLatencyMinutes))} min` : "—"],
    ["Avg WASO", currentMetric?.averageWasoMinutes ? `${Math.round(Number(currentMetric.averageWasoMinutes))} min` : "—"],
    ["Avg Sleep Efficiency", currentMetric?.averageSleepEfficiencyPercent ? `${Math.round(Number(currentMetric.averageSleepEfficiencyPercent))}%` : "—"],
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-600">Sleepbook</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-slate-950">Weekly metrics</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{formatDateRange(payload.diary.startDate, payload.diary.endDate)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/${diaryId}`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
          >
            Back to diary
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white transition hover:bg-black/90"
          >
            All diaries
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-500">Week 1</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const start = formatter.format(new Date(`${startDate}T00:00:00.000Z`));
  const end = formatter.format(new Date(`${endDate}T00:00:00.000Z`));
  return `${start} — ${end}`;
}

function formatClock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)} hrs`;
}
