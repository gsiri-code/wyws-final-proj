import { fetchJson } from "@/lib/api/client";

export type DayKind = "work" | "school" | "day_off";
export type TimelineItemType =
  | "sleep"
  | "in_bed"
  | "exercise"
  | "caffeine"
  | "alcohol"
  | "medicine"
  | "note";

export interface DiarySummary {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryWeek {
  id: string;
  diaryId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryDay {
  id: string;
  diaryId: string;
  diaryWeekId: string;
  userId: string;
  date: string;
  dayOfWeek: string;
  dayKind: DayKind | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineItem {
  id: string;
  diaryId: string;
  diaryWeekId: string;
  diaryDayId: string;
  userId: string;
  type: TimelineItemType;
  timestamp: string | null;
  startTime: string | null;
  endTime: string | null;
  label: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryMetric {
  id: string;
  diaryId: string;
  diaryWeekId: string;
  userId: string;
  averageBedtime: string | null;
  averageWakeTime: string | null;
  averageTotalSleepTimeMinutes: string | null;
  averageSleepLatencyMinutes: string | null;
  averageWasoMinutes: string | null;
  averageSleepEfficiencyPercent: string | null;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryDetail extends DiarySummary {
  userId: string;
  weeks: DiaryWeek[];
  days: DiaryDay[];
  timelineItems: TimelineItem[];
  metrics: DiaryMetric[];
}

interface DiariesResponse {
  diaries: DiarySummary[];
}

interface DiaryResponse {
  diary: DiaryDetail;
}

interface TimelineItemsResponse {
  timelineItems: TimelineItem[];
}

interface TimelineItemResponse {
  timelineItem: TimelineItem;
}

interface MetricsResponse {
  metrics: DiaryMetric[];
}

interface DeletedResponse {
  deleted: { id: string };
}

interface DiaryDayResponse {
  day: DiaryDay;
}

export function listDiaries() {
  return fetchJson<DiariesResponse>("/api/diaries");
}

export function createDiary(startDate: string) {
  return fetchJson<DiaryResponse>("/api/diaries", {
    method: "POST",
    body: JSON.stringify({ startDate }),
  });
}

export function getDiary(diaryId: string) {
  return fetchJson<DiaryResponse>(`/api/diaries/${diaryId}`);
}

export function deleteDiary(diaryId: string) {
  return fetchJson<DeletedResponse>(`/api/diaries/${diaryId}`, {
    method: "DELETE",
  });
}

export function patchDiaryDay(
  diaryId: string,
  dayId: string,
  body: { dayKind?: DayKind | null; notes?: string | null }
) {
  return fetchJson<DiaryDayResponse>(`/api/diaries/${diaryId}/days/${dayId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function listTimelineItems(diaryId: string) {
  return fetchJson<TimelineItemsResponse>(`/api/diaries/${diaryId}/timeline-items`);
}

export function createTimelineItem(
  diaryId: string,
  payload: Record<string, unknown>
) {
  return fetchJson<TimelineItemResponse>(`/api/diaries/${diaryId}/timeline-items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTimelineItem(
  diaryId: string,
  itemId: string,
  payload: Record<string, unknown>
) {
  return fetchJson<TimelineItemResponse>(
    `/api/diaries/${diaryId}/timeline-items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteTimelineItem(diaryId: string, itemId: string) {
  return fetchJson<DeletedResponse>(`/api/diaries/${diaryId}/timeline-items/${itemId}`, {
    method: "DELETE",
  });
}

export function recalculateMetrics(diaryId: string) {
  return fetchJson<MetricsResponse>(`/api/diaries/${diaryId}/metrics`, {
    method: "POST",
  });
}
