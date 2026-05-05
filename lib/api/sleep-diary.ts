import { and, asc, desc, eq } from "drizzle-orm";
import { diaries, diaryDays, diaryWeekMetrics, diaryWeeks, timelineItems } from "@/schema";
import type { AppDb } from "@/lib/api/db";
import { ApiError } from "@/lib/api/http";

const BEDTIME_TYPES = new Set(["in_bed"]);
const SLEEP_TYPES = new Set(["sleep"]);
const DAY_MS = 24 * 60 * 60 * 1000;

type DbClient = AppDb;

type CreateDiaryInput = {
  startDate: string;
};

type UpdateDiaryDayInput = {
  dayKind?: "work" | "school" | "day_off";
  notes?: string | null;
};

type CreateTimelineItemInput = {
  diaryDayId: string;
  type:
    | "sleep"
    | "in_bed"
    | "exercise"
    | "caffeine"
    | "alcohol"
    | "medicine"
    | "note";
  timestamp?: string;
  startTime?: string;
  endTime?: string;
  label?: string | null;
  metadata?: Record<string, unknown>;
};

type UpdateTimelineItemInput = {
  timestamp?: string;
  startTime?: string;
  endTime?: string;
  label?: string | null;
  metadata?: Record<string, unknown>;
};

type DiaryDayRow = typeof diaryDays.$inferSelect;
type TimelineItemRow = typeof timelineItems.$inferSelect;

export async function listDiaries(db: DbClient) {
  const rows = await db
    .select({
      id: diaries.id,
      startDate: diaries.startDate,
      endDate: diaries.endDate,
      createdAt: diaries.createdAt,
      updatedAt: diaries.updatedAt,
    })
    .from(diaries)
    .orderBy(desc(diaries.startDate));

  return rows;
}

export async function createDiary(db: DbClient, userId: string, input: CreateDiaryInput) {
  const startDate = parseDateOnly(input.startDate);
  const endDate = addDays(startDate, 6);

  const [diary] = await db
    .insert(diaries)
    .values({
      userId,
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(endDate),
    })
    .returning();

  if (!diary) {
    throw new ApiError("Failed to create diary", 500);
  }

  const weeks = await db
    .insert(diaryWeeks)
    .values(
      {
        diaryId: diary.id,
        startDate: formatDateOnly(startDate),
        endDate: formatDateOnly(addDays(startDate, 6)),
      }
    )
    .returning();

  const week = weeks[0];

  await db.insert(diaryDays).values(
    Array.from({ length: 7 }, (_, index) => {
      const currentDate = addDays(startDate, index);

      if (!week) {
        throw new ApiError("Failed to initialize diary weeks", 500);
      }

      return {
        diaryId: diary.id,
        diaryWeekId: week.id,
        userId,
        date: formatDateOnly(currentDate),
        dayOfWeek: new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          timeZone: "UTC",
        }).format(currentDate),
      };
    })
  );

  return getDiaryById(db, diary.id);
}

export async function getDiaryById(db: DbClient, diaryId: string) {
  const [diary] = await db.select().from(diaries).where(eq(diaries.id, diaryId)).limit(1);

  if (!diary) {
    throw new ApiError("Diary not found", 404);
  }

  const weeks = await db
    .select()
    .from(diaryWeeks)
    .where(eq(diaryWeeks.diaryId, diaryId))
    .orderBy(asc(diaryWeeks.startDate));

  const days = await db
    .select()
    .from(diaryDays)
    .where(eq(diaryDays.diaryId, diaryId))
    .orderBy(asc(diaryDays.date));

  const items = await db
    .select()
    .from(timelineItems)
    .where(eq(timelineItems.diaryId, diaryId))
    .orderBy(asc(timelineItems.startTime), asc(timelineItems.timestamp), asc(timelineItems.createdAt));

  const metrics = await db
    .select()
    .from(diaryWeekMetrics)
    .where(eq(diaryWeekMetrics.diaryId, diaryId))
    .orderBy(asc(diaryWeekMetrics.createdAt));

  return {
    ...diary,
    weeks,
    days,
    timelineItems: items,
    metrics,
  };
}

export async function updateDiaryDay(
  db: DbClient,
  diaryId: string,
  dayId: string,
  input: UpdateDiaryDayInput
) {
  const [day] = await db
    .update(diaryDays)
    .set({
      ...(input.dayKind !== undefined ? { dayKind: input.dayKind } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(diaryDays.id, dayId), eq(diaryDays.diaryId, diaryId)))
    .returning();

  if (!day) {
    throw new ApiError("Diary day not found", 404);
  }

  return day;
}

export async function listTimelineItems(db: DbClient, diaryId: string) {
  return db
    .select()
    .from(timelineItems)
    .where(eq(timelineItems.diaryId, diaryId))
    .orderBy(asc(timelineItems.startTime), asc(timelineItems.timestamp), asc(timelineItems.createdAt));
}

export async function createTimelineItem(
  db: DbClient,
  userId: string,
  diaryId: string,
  input: CreateTimelineItemInput
) {
  const [day] = await db
    .select({
      id: diaryDays.id,
      diaryWeekId: diaryDays.diaryWeekId,
    })
    .from(diaryDays)
    .where(and(eq(diaryDays.id, input.diaryDayId), eq(diaryDays.diaryId, diaryId)))
    .limit(1);

  if (!day) {
    throw new ApiError("Diary day not found for this diary", 404);
  }

  const [item] = await db
    .insert(timelineItems)
    .values({
      diaryId,
      diaryWeekId: day.diaryWeekId,
      diaryDayId: day.id,
      userId,
      type: input.type,
      timestamp: input.timestamp ? new Date(input.timestamp) : null,
      startTime: input.startTime ? new Date(input.startTime) : null,
      endTime: input.endTime ? new Date(input.endTime) : null,
      label: input.label ?? null,
      metadata: input.metadata ?? {},
    })
    .returning();

  if (!item) {
    throw new ApiError("Failed to create timeline item", 500);
  }

  return item;
}

export async function updateTimelineItem(
  db: DbClient,
  diaryId: string,
  itemId: string,
  input: UpdateTimelineItemInput
) {
  const [item] = await db
    .update(timelineItems)
    .set({
      ...(input.timestamp !== undefined ? { timestamp: input.timestamp ? new Date(input.timestamp) : null } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime ? new Date(input.startTime) : null } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime ? new Date(input.endTime) : null } : {}),
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(timelineItems.id, itemId), eq(timelineItems.diaryId, diaryId)))
    .returning();

  if (!item) {
    throw new ApiError("Timeline item not found", 404);
  }

  validateTimelineShape(item);

  return item;
}

export async function deleteTimelineItem(db: DbClient, diaryId: string, itemId: string) {
  const [item] = await db
    .delete(timelineItems)
    .where(and(eq(timelineItems.id, itemId), eq(timelineItems.diaryId, diaryId)))
    .returning({ id: timelineItems.id });

  if (!item) {
    throw new ApiError("Timeline item not found", 404);
  }

  return item;
}

export async function recalculateDiaryMetrics(db: DbClient, diaryId: string, userId: string) {
  const weeks = await db
    .select()
    .from(diaryWeeks)
    .where(eq(diaryWeeks.diaryId, diaryId))
    .orderBy(asc(diaryWeeks.startDate));

  if (weeks.length === 0) {
    throw new ApiError("Diary not found", 404);
  }

  const days = await db
    .select()
    .from(diaryDays)
    .where(eq(diaryDays.diaryId, diaryId))
    .orderBy(asc(diaryDays.date));

  const items = await db
    .select()
    .from(timelineItems)
    .where(eq(timelineItems.diaryId, diaryId))
    .orderBy(asc(timelineItems.createdAt));

  const itemsByWeekId = groupBy(items, (item) => item.diaryWeekId);
  const itemDays = groupBy(items, (item) => item.diaryDayId);

  const metricRows = [] as (typeof diaryWeekMetrics.$inferInsert)[];

  for (const week of weeks) {
    const weekDays = days.filter((day) => day.diaryWeekId === week.id);
    const weekItems = itemsByWeekId.get(week.id) ?? [];

    const computed = computeWeekMetrics(weekDays, weekItems, itemDays);

    metricRows.push({
      diaryId,
      diaryWeekId: week.id,
      userId,
      averageBedtime: computed.averageBedtime,
      averageWakeTime: computed.averageWakeTime,
      averageTotalSleepTimeMinutes: computed.averageTotalSleepTimeMinutes?.toFixed(2) ?? null,
      averageSleepLatencyMinutes: computed.averageSleepLatencyMinutes?.toFixed(2) ?? null,
      averageWasoMinutes: computed.averageWasoMinutes?.toFixed(2) ?? null,
      averageSleepEfficiencyPercent: computed.averageSleepEfficiencyPercent?.toFixed(2) ?? null,
      calculatedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  for (const row of metricRows) {
    await db
      .insert(diaryWeekMetrics)
      .values(row)
      .onConflictDoUpdate({
        target: diaryWeekMetrics.diaryWeekId,
        set: {
          averageBedtime: row.averageBedtime,
          averageWakeTime: row.averageWakeTime,
          averageTotalSleepTimeMinutes: row.averageTotalSleepTimeMinutes,
          averageSleepLatencyMinutes: row.averageSleepLatencyMinutes,
          averageWasoMinutes: row.averageWasoMinutes,
          averageSleepEfficiencyPercent: row.averageSleepEfficiencyPercent,
          calculatedAt: row.calculatedAt,
          updatedAt: new Date(),
        },
      });
  }

  return db
    .select()
    .from(diaryWeekMetrics)
    .where(eq(diaryWeekMetrics.diaryId, diaryId))
    .orderBy(asc(diaryWeekMetrics.createdAt));
}

function computeWeekMetrics(
  weekDays: DiaryDayRow[],
  weekItems: TimelineItemRow[],
  itemsByDayId: Map<string, TimelineItemRow[]>
) {
  const bedtimeMinutes = [] as number[];
  const wakeMinutes = [] as number[];
  const totalSleepMinutes = [] as number[];
  const latencyMinutes = [] as number[];
  const wasoMinutes = [] as number[];
  const efficiencyPercentages = [] as number[];

  for (const day of weekDays) {
    const dayItems = itemsByDayId.get(day.id) ?? [];
    const daySummary = computeDayMetrics(day, dayItems);

    if (daySummary.bedtimeMinutes !== null) bedtimeMinutes.push(daySummary.bedtimeMinutes);
    if (daySummary.wakeMinutes !== null) wakeMinutes.push(daySummary.wakeMinutes);
    if (daySummary.totalSleepMinutes !== null) totalSleepMinutes.push(daySummary.totalSleepMinutes);
    if (daySummary.sleepLatencyMinutes !== null) latencyMinutes.push(daySummary.sleepLatencyMinutes);
    if (daySummary.wasoMinutes !== null) wasoMinutes.push(daySummary.wasoMinutes);
    if (daySummary.sleepEfficiencyPercent !== null) efficiencyPercentages.push(daySummary.sleepEfficiencyPercent);
  }

  if (weekItems.length === 0 && weekDays.every((day) => (itemsByDayId.get(day.id) ?? []).length === 0)) {
    return {
      averageBedtime: null,
      averageWakeTime: null,
      averageTotalSleepTimeMinutes: null,
      averageSleepLatencyMinutes: null,
      averageWasoMinutes: null,
      averageSleepEfficiencyPercent: null,
    };
  }

  return {
    averageBedtime: averageClockTime(bedtimeMinutes),
    averageWakeTime: averageClockTime(wakeMinutes),
    averageTotalSleepTimeMinutes: averageNumber(totalSleepMinutes),
    averageSleepLatencyMinutes: averageNumber(latencyMinutes),
    averageWasoMinutes: averageNumber(wasoMinutes),
    averageSleepEfficiencyPercent: averageNumber(efficiencyPercentages),
  };
}

function computeDayMetrics(day: DiaryDayRow, items: TimelineItemRow[]) {
  const events = items
    .map((item) => ({
      ...item,
      eventStart: item.startTime ?? item.timestamp,
      eventEnd: item.endTime ?? item.timestamp,
    }))
    .filter((item) => item.eventStart);

  const bedtimeEvent = firstByType(events, BEDTIME_TYPES, true);
  const sleepEvent = firstByType(events, SLEEP_TYPES, true);
  const sleepIntervals = items.filter(
    (item) =>
      item.type === "sleep" &&
      item.startTime &&
      item.endTime &&
      (item.metadata as Record<string, unknown> | null | undefined)?.["segment"] !== "nap" &&
      (item.metadata as Record<string, unknown> | null | undefined)?.["role"] !== "waso"
  );
  const wasoIntervals = items.filter(
    (item) =>
      item.type === "sleep" &&
      item.startTime &&
      item.endTime &&
      (item.metadata as Record<string, unknown> | null | undefined)?.["role"] === "waso"
  );

  const bedtime = bedtimeEvent?.eventStart ?? sleepEvent?.eventStart ?? null;
  const wake = latestSleepEnd(items) ?? null;
  const sleepStart = sleepEvent?.eventStart ?? null;

  const bedtimeMinutes = bedtime ? toMinutesAfterMidnight(bedtime) : null;
  const wakeMinutes = wake ? toMinutesAfterMidnight(wake) : null;
  const totalSleepMinutes = sumIntervals(sleepIntervals);
  const sleepLatencyMinutes = bedtime && sleepStart ? diffMinutes(bedtime, sleepStart) : null;
  const wasoMinutes = sumIntervals(wasoIntervals);
  const timeInBedMinutes = bedtime && wake ? diffMinutes(bedtime, wake) : null;

  const sleepEfficiencyPercent =
    timeInBedMinutes && timeInBedMinutes > 0 && totalSleepMinutes !== null
      ? (totalSleepMinutes / timeInBedMinutes) * 100
      : null;

  return {
    day,
    bedtimeMinutes,
    wakeMinutes,
    totalSleepMinutes,
    sleepLatencyMinutes:
      sleepLatencyMinutes !== null && sleepLatencyMinutes >= 0 ? sleepLatencyMinutes : null,
    wasoMinutes,
    sleepEfficiencyPercent,
  };
}

function firstByType<T extends { type: string; eventStart: Date | null }>(
  items: T[],
  types: Set<string>,
  ascending: boolean
) {
  const matches = items.filter((item) => item.eventStart && types.has(item.type));
  matches.sort((a, b) => {
    const delta = a.eventStart!.getTime() - b.eventStart!.getTime();
    return ascending ? delta : -delta;
  });
  return matches[0] ?? null;
}

function latestSleepEnd(items: TimelineItemRow[]) {
  const ends = items
    .filter(
      (item) =>
        item.type === "sleep" &&
        item.endTime instanceof Date &&
        (item.metadata as Record<string, unknown> | null | undefined)?.["segment"] !== "nap" &&
        (item.metadata as Record<string, unknown> | null | undefined)?.["role"] !== "waso"
    )
    .map((item) => item.endTime as Date);

  if (ends.length === 0) {
    return null;
  }

  ends.sort((a, b) => b.getTime() - a.getTime());
  return ends[0];
}

function sumIntervals(items: TimelineItemRow[]) {
  if (items.length === 0) {
    return null;
  }

  return items.reduce((total, item) => {
    if (!item.startTime || !item.endTime) {
      return total;
    }

    return total + diffMinutes(item.startTime, item.endTime);
  }, 0);
}

function averageNumber(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageClockTime(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0) / values.length;
  const roundedMinutes = Math.round(total);
  const hours = Math.floor(roundedMinutes / 60) % 24;
  const minutes = roundedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function toMinutesAfterMidnight(date: Date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function diffMinutes(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / 60000;
}

function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError("Invalid startDate", 422);
  }

  return date;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_MS);
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

function validateTimelineShape(item: TimelineItemRow) {
  const hasPoint = item.timestamp !== null;
  const hasInterval = item.startTime !== null || item.endTime !== null;

  if (hasPoint && hasInterval) {
    throw new ApiError("Timeline item cannot contain both point and interval times", 422);
  }

  if (!hasPoint && (!item.startTime || !item.endTime)) {
    throw new ApiError("Timeline item must contain either timestamp or start/end times", 422);
  }

  if (item.startTime && item.endTime && item.endTime <= item.startTime) {
    throw new ApiError("Timeline interval endTime must be after startTime", 422);
  }
}
