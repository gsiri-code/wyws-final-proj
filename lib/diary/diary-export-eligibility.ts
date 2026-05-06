import { APP_TIME_ZONE } from "@/lib/diary/aasm-grid";

const currentDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function isDiaryWeekCompletedForExport(endDate: string, now = new Date()) {
  return endDate < getCurrentAppDateForExport(now);
}

function getCurrentAppDateForExport(now: Date) {
  const parts = currentDateFormatter.formatToParts(now);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}
