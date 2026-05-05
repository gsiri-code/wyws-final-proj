import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/**
 * Split-panel auth shell. Mobile: stacked, marketing strip on top. Desktop:
 * navy left rail with marketing copy, white right rail with the form.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-0 w-full">
      <aside className="relative hidden lg:flex flex-col justify-between w-1/2 max-w-[640px] bg-navy text-white p-12 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-dotted opacity-[0.08]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-32 h-[400px] w-[400px] glow-purple"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-160px] right-[-160px] h-[460px] w-[460px] rounded-full bg-purple/20 blur-3xl"
        />

        <div className="relative z-10 flex items-center justify-between">
          <Logo variant="light" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </div>

        <div className="relative z-10 space-y-8 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80 backdrop-blur-sm">
            7-day sleep diary
          </span>
          <h2 className="font-display text-4xl xl:text-5xl leading-[1.05] tracking-tight">
            Track your week clearly. Submit better reports.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            AASM-style logging with automatic weekly metrics and clean,
            export-ready records — saved to the cloud, available on every
            device.
          </p>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex gap-3">
              <span
                aria-hidden
                className="mt-1 size-1.5 rounded-full bg-purple shrink-0"
              />
              Daily prompts for bedtime, wake, latency, WASO, and sleep
              efficiency.
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden
                className="mt-1 size-1.5 rounded-full bg-mint shrink-0"
              />
              Track caffeine, alcohol, naps, and notes alongside each night.
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden
                className="mt-1 size-1.5 rounded-full bg-yellow-strong shrink-0"
              />
              Weekly metric cards calculated automatically — no spreadsheets.
            </li>
          </ul>
        </div>

        <div className="relative z-10 rounded-card border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
          <p className="text-sm text-white/85 leading-relaxed font-display italic">
            “Sleepbook turned a clipboard chore into something I genuinely
            don’t mind doing every morning.”
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-white/50">
            Maya R., undergraduate sleep cohort
          </p>
        </div>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-dotted opacity-[0.4] lg:opacity-[0.5]"
        />
        <div className="relative z-10 w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center justify-between">
            <Logo />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Home
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
