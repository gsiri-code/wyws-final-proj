import { APP_TIME_ZONE } from "@/lib/diary/aasm-grid";
import { formatDiaryDayKindLabel } from "@/lib/diary/aasm-presentation";

type DiaryForExport = {
  id: string;
  startDate: string;
  endDate: string;
  weeks: Array<{ id: string }>;
  days: Array<{
    id: string;
    date: string;
    dayOfWeek: string;
    dayKind: "work" | "school" | "day_off" | null;
    notes: string | null;
  }>;
  timelineItems: Array<{
    id: string;
    diaryDayId: string;
    type: string;
    timestamp: Date | string | null;
    startTime: Date | string | null;
    endTime: Date | string | null;
    label: string | null;
    metadata: unknown;
  }>;
};

type DiaryMetricForExport = {
  diaryWeekId: string;
  averageBedtime: string | null;
  averageWakeTime: string | null;
  averageTotalSleepTimeMinutes: string | number | null;
  averageSleepLatencyMinutes: string | number | null;
  averageWasoMinutes: string | number | null;
  averageSleepEfficiencyPercent: string | number | null;
};

export type WeeklyExportInput = {
  diary: DiaryForExport;
  metrics: DiaryMetricForExport[];
};

export type WeeklyExportMetric = {
  label: string;
  value: string;
};

export type WeeklyExportTimelineEntry = {
  id: string;
  typeLabel: string;
  timeLabel: string;
  durationLabel: string | null;
  label: string | null;
};

export type WeeklyExportDay = {
  id: string;
  title: string;
  dateLabel: string;
  dayKind: string;
  notes: string | null;
  entries: WeeklyExportTimelineEntry[];
};

export type WeeklyExportGridDay = {
  id: string;
  date: string;
  dateLabel: string;
  weekdayLabel: string;
  dayKindLabel: string;
};

export type WeeklyExportGridItem = {
  id: string;
  diaryDayId: string;
  type: string;
  timestamp: Date | string | null;
  startTime: Date | string | null;
  endTime: Date | string | null;
  metadata: unknown;
};

export type WeeklyExportData = {
  diaryId: string;
  dateRangeLabel: string;
  generatedAtLabel: string;
  timeZone: string;
  metrics: WeeklyExportMetric[];
  days: WeeklyExportDay[];
  grid: {
    days: WeeklyExportGridDay[];
    timelineItems: WeeklyExportGridItem[];
  };
};

type DiaryDayForExport = WeeklyExportInput["diary"]["days"][number];
type TimelineItemForExport = WeeklyExportInput["diary"]["timelineItems"][number];
type SortableEntry = WeeklyExportTimelineEntry & { sortKey: number };

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const gridDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: APP_TIME_ZONE,
});

const generatedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: APP_TIME_ZONE,
  timeZoneName: "short",
});

export function formatWeeklyExport(input: WeeklyExportInput): WeeklyExportData {
  const metrics = pickWeekMetric(input.diary.weeks[0]?.id, input.metrics);
  const timelineItemsByDay = groupBy(input.diary.timelineItems, (item) => item.diaryDayId);
  const sortedDays = [...input.diary.days].sort((left, right) => left.date.localeCompare(right.date));

  return {
    diaryId: input.diary.id,
    dateRangeLabel: `${formatDate(input.diary.startDate)} — ${formatDate(input.diary.endDate)}`,
    generatedAtLabel: generatedAtFormatter.format(new Date()),
    timeZone: APP_TIME_ZONE,
    metrics: formatMetrics(metrics),
    days: sortedDays.map((day) => formatDay(day, timelineItemsByDay.get(day.id) ?? [])),
    grid: {
      days: sortedDays.map(formatGridDay),
      timelineItems: input.diary.timelineItems.map((item) => ({
        id: item.id,
        diaryDayId: item.diaryDayId,
        type: item.type,
        timestamp: item.timestamp,
        startTime: item.startTime,
        endTime: item.endTime,
        metadata: item.metadata,
      })),
    },
  };
}

function formatDay(day: DiaryDayForExport, items: TimelineItemForExport[]): WeeklyExportDay {
  const entries = items
    .map(formatTimelineEntry)
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((entry) => ({
      id: entry.id,
      typeLabel: entry.typeLabel,
      timeLabel: entry.timeLabel,
      durationLabel: entry.durationLabel,
      label: entry.label,
    }));

  return {
    id: day.id,
    title: day.dayOfWeek,
    dateLabel: formatDate(day.date),
    dayKind: formatNarrativeDayKind(day.dayKind),
    notes: day.notes,
    entries,
  };
}

function formatGridDay(day: DiaryDayForExport): WeeklyExportGridDay {
  return {
    id: day.id,
    date: day.date,
    dateLabel: gridDateFormatter.format(new Date(`${day.date}T00:00:00.000Z`)),
    weekdayLabel: day.dayOfWeek.slice(0, 3),
    dayKindLabel: formatDiaryDayKindLabel(day.dayKind),
  };
}

function formatTimelineEntry(item: TimelineItemForExport): SortableEntry {
  const pointTime = toDate(item.timestamp);

  if (pointTime) {
    return {
      id: item.id,
      typeLabel: formatTypeLabel(item.type, item.metadata),
      timeLabel: formatClock(pointTime),
      durationLabel: null,
      label: item.label,
      sortKey: pointTime.getTime(),
    };
  }

  const start = toDate(item.startTime);
  const end = toDate(item.endTime);

  if (start && end) {
    return {
      id: item.id,
      typeLabel: formatTypeLabel(item.type, item.metadata),
      timeLabel: `${formatClock(start)} – ${formatClock(end)}`,
      durationLabel: formatDurationMinutes((end.getTime() - start.getTime()) / 60000),
      label: item.label,
      sortKey: start.getTime(),
    };
  }

  return {
    id: item.id,
    typeLabel: formatTypeLabel(item.type, item.metadata),
    timeLabel: "Time unavailable",
    durationLabel: null,
    label: item.label,
    sortKey: Number.MAX_SAFE_INTEGER,
  };
}

function formatMetrics(metric: DiaryMetricForExport | null): WeeklyExportMetric[] {
  return [
    { label: "Avg bedtime", value: formatClockValue(metric?.averageBedtime) },
    { label: "Avg wake", value: formatClockValue(metric?.averageWakeTime) },
    {
      label: "Avg total sleep",
      value: formatDurationMetric(metric?.averageTotalSleepTimeMinutes),
    },
    {
      label: "Avg sleep latency",
      value: formatMinuteMetric(metric?.averageSleepLatencyMinutes),
    },
    { label: "Avg WASO", value: formatMinuteMetric(metric?.averageWasoMinutes) },
    {
      label: "Avg efficiency",
      value: formatPercentMetric(metric?.averageSleepEfficiencyPercent),
    },
  ];
}

function pickWeekMetric(weekId: string | undefined, metrics: DiaryMetricForExport[]) {
  if (metrics.length === 0) return null;
  if (!weekId) return metrics[0];
  return metrics.find((metric) => metric.diaryWeekId === weekId) ?? metrics[0];
}

function formatTypeLabel(type: string, metadata: unknown) {
  const metadataRecord = asRecord(metadata);

  if (type === "sleep" && metadataRecord?.["segment"] === "nap") return "Nap";
  if (type === "sleep" && metadataRecord?.["role"] === "waso") return "WASO";

  const labels: Record<string, string> = {
    sleep: "Sleep",
    in_bed: "In bed",
    exercise: "Exercise",
    caffeine: "Caffeine",
    alcohol: "Alcohol",
    medicine: "Medicine",
    note: "Note",
  };

  return labels[type] ?? toTitleCase(type.replaceAll("_", " "));
}

function formatNarrativeDayKind(kind: DiaryDayForExport["dayKind"]) {
  const label = formatDiaryDayKindLabel(kind);
  return label === "—" ? "Unspecified" : label;
}

function formatClockValue(value: string | null | undefined) {
  if (!value) return "—";

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return "—";

  const period = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatDurationMetric(value: string | number | null | undefined) {
  const minutes = toNumber(value);
  if (minutes === null) return "—";
  return formatDurationMinutes(minutes);
}

function formatMinuteMetric(value: string | number | null | undefined) {
  const minutes = toNumber(value);
  if (minutes === null) return "—";
  return `${Math.round(minutes)} min`;
}

function formatPercentMetric(value: string | number | null | undefined) {
  const percentage = toNumber(value);
  if (percentage === null) return "—";
  return `${Math.round(percentage)}%`;
}

function formatDurationMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";

  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

function formatClock(value: Date) {
  return clockFormatter.format(value);
}

function toDate(value: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const current = map.get(key);
    if (current) {
      current.push(item);
      continue;
    }

    map.set(key, [item]);
  }

  return map;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
