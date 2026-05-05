import type { DiaryDay, TimelineItem } from "@/lib/api/diaries-client";

export const APP_TIME_ZONE = "America/New_York";
const HOUR_MS = 60 * 60 * 1000;

const timeZoneFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function getDiaryHourLabels() {
  return [
    "Noon",
    "1 PM",
    "2 PM",
    "3 PM",
    "4 PM",
    "5 PM",
    "6 PM",
    "7 PM",
    "8 PM",
    "9 PM",
    "10 PM",
    "11 PM",
    "Midnight",
    "1 AM",
    "2 AM",
    "3 AM",
    "4 AM",
    "5 AM",
    "6 AM",
    "7 AM",
    "8 AM",
    "9 AM",
    "10 AM",
    "11 AM",
  ];
}

export function getCellDateTimeRange(dayDate: string, hourIndex: number) {
  const { date, hour } = getCellLocalDate(dayDate, hourIndex);
  const start = zonedTimeToUtc(date, hour);
  const end = new Date(start.getTime() + HOUR_MS);

  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function getHourIndexFromDateTime(dateTime: Date | string, diaryDayDate: string) {
  const value = toDate(dateTime);

  for (let hourIndex = 0; hourIndex < 24; hourIndex += 1) {
    const range = getCellDateTimeRange(diaryDayDate, hourIndex);
    if (value >= range.start && value < range.end) return hourIndex;
  }

  return null;
}

export function getCellsForTimelineItem(item: TimelineItem, diaryDayDate: string) {
  if (item.timestamp) {
    const hourIndex = getHourIndexFromDateTime(item.timestamp, diaryDayDate);
    return hourIndex === null ? [] : [hourIndex];
  }

  if (!item.startTime || !item.endTime) return [];
  const start = toDate(item.startTime);
  const end = toDate(item.endTime);
  const cells: number[] = [];

  for (let hourIndex = 0; hourIndex < 24; hourIndex += 1) {
    const range = getCellDateTimeRange(diaryDayDate, hourIndex);
    if (start < range.end && end > range.start) cells.push(hourIndex);
  }

  return cells;
}

export function mapTimelineItemsToGrid(days: DiaryDay[], timelineItems: TimelineItem[]) {
  const dayDateById = new Map(days.map((day) => [day.id, day.date]));
  const grid = new Map<string, TimelineItem>();

  for (const item of timelineItems) {
    const dayDate = dayDateById.get(item.diaryDayId);
    if (!dayDate) continue;

    for (const hourIndex of getCellsForTimelineItem(item, dayDate)) {
      grid.set(getGridCellKey(item.diaryDayId, hourIndex), item);
    }
  }

  return grid;
}

export function hasOverlap(
  selectedCells: number[],
  existingTimelineItems: TimelineItem[],
  diaryDayDate: string,
  itemId?: string
) {
  const occupied = new Set<number>();

  for (const item of existingTimelineItems) {
    if (item.id === itemId) continue;
    for (const cell of getCellsForTimelineItem(item, diaryDayDate)) occupied.add(cell);
  }

  return selectedCells.some((cell) => occupied.has(cell));
}

export function isSleepHour(hourIndex: number) {
  return hourIndex >= 7 && hourIndex <= 23;
}

export function isNapHour(hourIndex: number) {
  return hourIndex >= 0 && hourIndex <= 7;
}

export function getNowInAppTimezone() {
  return getTimeZoneParts(new Date());
}

export function isDiaryDayInFuture(dayDate: string) {
  return dayDate > getCurrentAppDate();
}

export function isDiaryDayInPast(dayDate: string) {
  return dayDate < getCurrentAppDate();
}

export function isTodayInAppTimezone(dayDate: string) {
  return dayDate === getCurrentAppDate();
}

export function getCurrentEditableHourIndex(dayDate: string) {
  const currentHour = getCurrentAppHourStart();
  let lastEditable = -1;

  for (let hourIndex = 0; hourIndex < 24; hourIndex += 1) {
    if (getCellDateTimeRange(dayDate, hourIndex).start <= currentHour) {
      lastEditable = hourIndex;
    }
  }

  return lastEditable;
}

export function isCellEditable(dayDate: string, hourIndex: number) {
  return getCellDateTimeRange(dayDate, hourIndex).start <= getCurrentAppHourStart();
}

export function getGridCellKey(dayId: string, hourIndex: number) {
  return `${dayId}:${hourIndex}`;
}

function getCellLocalDate(dayDate: string, hourIndex: number) {
  if (hourIndex < 12) return { date: dayDate, hour: hourIndex + 12 };
  return { date: addDays(dayDate, 1), hour: hourIndex - 12 };
}

function getCurrentAppDate() {
  const now = getNowInAppTimezone();
  return formatDateKey(now.year, now.month, now.day);
}

function getCurrentAppHourStart() {
  const now = getNowInAppTimezone();
  return zonedTimeToUtc(formatDateKey(now.year, now.month, now.day), now.hour);
}

function zonedTimeToUtc(date: string, hour: number) {
  const [year, month, day] = date.split("-").map(Number);
  let guess = new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0));

  for (let index = 0; index < 3; index += 1) {
    const current = getTimeZoneParts(guess);
    const targetMs = Date.UTC(year, month - 1, day, hour, 0, 0, 0);
    const currentMs = Date.UTC(
      current.year,
      current.month - 1,
      current.day,
      current.hour,
      current.minute,
      current.second,
      0
    );
    guess = new Date(guess.getTime() + (targetMs - currentMs));
  }

  return guess;
}

function getTimeZoneParts(date: Date) {
  const parts = timeZoneFormatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

function formatDateKey(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(date: string, amount: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + amount);
  return next.toISOString().slice(0, 10);
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}
