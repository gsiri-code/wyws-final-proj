import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Sleep trends and charts (coming soon).",
};

export default function DashboardAnalyticsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-600">Sleepbook</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-slate-950">Analytics</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Visualize sleep efficiency, bedtime stability, and week-over-week changes. Coming soon.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
