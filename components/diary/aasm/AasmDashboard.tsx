"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AasmDiaryGrid } from "@/components/diary/aasm/AasmDiaryGrid";
import { EventCreateModal } from "@/components/diary/aasm/EventCreateModal";
import { EventEditModal } from "@/components/diary/aasm/EventEditModal";
import { EventTypeLegend } from "@/components/diary/aasm/EventTypeLegend";
import { signOut } from "@/lib/api/auth-client";
import {
  createDiary,
  createTimelineItem,
  deleteTimelineItem,
  patchDiaryDay,
  recalculateMetrics,
  updateTimelineItem,
  type DayKind,
  type DiaryDay,
  type DiaryDetail,
  type DiaryMetric,
  type TimelineItem,
} from "@/lib/api/diaries-client";
import {
  getCellDateTimeRange,
  getCellsForTimelineItem,
  getCurrentEditableHourIndex,
  hasOverlap,
  isCellEditable,
  isNapHour,
  isSleepHour,
} from "@/lib/diary/aasm-grid";

interface AasmDashboardProps {
  initialDiary: DiaryDetail | null;
}

type DragState = {
  day: DiaryDay;
  anchor: number;
  current: number;
  moved: boolean;
};

type CreateState = {
  day: DiaryDay;
  cells: number[];
  mode: "point" | "interval";
};

type EditState = {
  day: DiaryDay;
  item: TimelineItem;
};

export function AasmDashboard({ initialDiary }: AasmDashboardProps) {
  const [diary, setDiary] = React.useState(initialDiary);
  const [error, setError] = React.useState<string | null>(null);
  const [creatingDiary, setCreatingDiary] = React.useState(false);
  const [dragState, setDragState] = React.useState<DragState | null>(null);
  const [createState, setCreateState] = React.useState<CreateState | null>(null);
  const [editState, setEditState] = React.useState<EditState | null>(null);

  const finalizeSelection = React.useCallback(() => {
    if (!dragState || !diary) {
      setDragState(null);
      return;
    }

    const cells = getSelectedCells(dragState.anchor, dragState.current);
    setDragState(null);

    if (cells.some((hourIndex) => !isCellEditable(dragState.day.date, hourIndex))) {
      toast.error("Selection includes locked hours.");
      return;
    }

    if (dragState.moved) {
      setCreateState({ day: dragState.day, cells, mode: "interval" });
      return;
    }

    setCreateState({ day: dragState.day, cells, mode: "point" });
  }, [diary, dragState]);

  React.useEffect(() => {
    function handlePointerUp() {
      finalizeSelection();
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [finalizeSelection]);

  const refreshMetrics = React.useCallback(async (diaryId: string) => {
    try {
      const { metrics } = await recalculateMetrics(diaryId);
      setDiary((current) => {
        if (!current || current.id !== diaryId) return current;
        return { ...current, metrics };
      });
    } catch {
      // Non-fatal: timeline edits should remain visible even if metrics refresh fails.
    }
  }, []);

  const handleCellPointerDown = React.useCallback((day: DiaryDay, hourIndex: number, item?: TimelineItem) => {
    if (item) {
      if (!isCellEditable(day.date, hourIndex)) {
        toast.error("This event is locked.");
        return;
      }

      setEditState({ day, item });
      return;
    }

    if (!isCellEditable(day.date, hourIndex)) {
      toast.error("Future hours are locked.");
      return;
    }

    setDragState({ day, anchor: hourIndex, current: hourIndex, moved: false });
  }, []);

  const handleCellPointerEnter = React.useCallback((day: DiaryDay, hourIndex: number) => {
    setDragState((current) => {
      if (!current || current.day.id !== day.id || !isCellEditable(day.date, hourIndex)) return current;
      return {
        ...current,
        current: hourIndex,
        moved: current.moved || current.anchor !== hourIndex,
      };
    });
  }, []);

  const handleCreateDiary = React.useCallback(
    async (startDate: string) => {
      setCreatingDiary(true);
      setError(null);

      try {
        const { diary: nextDiary } = await createDiary(startDate);
        setDiary(nextDiary);
        void refreshMetrics(nextDiary.id);
        toast.success("7-day diary created.");
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to create diary.");
      } finally {
        setCreatingDiary(false);
      }
    },
    [refreshMetrics]
  );

  const handleCreateEvent = React.useCallback(
    async (values: { type: string; label: string }) => {
      if (!diary || !createState) return;
      if (createState.mode === "interval" && !canCreateInterval(createState.cells, values.type)) {
        toast.error("That event type is not allowed for the selected hours.");
        return;
      }

      const dayItems = diary.timelineItems.filter((item) => item.diaryDayId === createState.day.id);
      if (hasOverlap(createState.cells, dayItems, createState.day.date)) {
        toast.error("Those hours already contain an event.");
        return;
      }

      const payload = buildCreatePayload(createState, values);
      const optimisticItem = buildOptimisticTimelineItem(diary.id, createState.day, payload);

      setCreateState(null);
      setDiary((current) => {
        if (!current || current.id !== diary.id) return current;
        return {
          ...current,
          timelineItems: [...current.timelineItems, optimisticItem],
        };
      });

      try {
        const { timelineItem } = await createTimelineItem(diary.id, payload);
        setDiary((current) => {
          if (!current || current.id !== diary.id) return current;
          return {
            ...current,
            timelineItems: current.timelineItems.map((item) =>
              item.id === optimisticItem.id ? timelineItem : item
            ),
          };
        });
        void refreshMetrics(diary.id);
        toast.success("Event added.");
      } catch (nextError) {
        setDiary((current) => {
          if (!current || current.id !== diary.id) return current;
          return {
            ...current,
            timelineItems: current.timelineItems.filter((item) => item.id !== optimisticItem.id),
          };
        });
        toast.error(nextError instanceof Error ? nextError.message : "Failed to add event.");
      }
    },
    [createState, diary, refreshMetrics]
  );

  const handleSaveEdit = React.useCallback(
    async (payload: Record<string, unknown>) => {
      if (!diary || !editState) return;

      const previousItem = editState.item;
      const previewItem = applyTimelinePayload(previousItem, payload);
      const previewCells = getCellsForTimelineItem(previewItem, editState.day.date);
      const dayItems = diary.timelineItems.filter((item) => item.diaryDayId === editState.day.id);

      if (hasOverlap(previewCells, dayItems, editState.day.date, editState.item.id)) {
        toast.error("The updated event overlaps an existing entry.");
        return;
      }

      setEditState(null);
      setDiary((current) => {
        if (!current || current.id !== diary.id) return current;
        return {
          ...current,
          timelineItems: current.timelineItems.map((item) =>
            item.id === previousItem.id ? previewItem : item
          ),
        };
      });

      try {
        const { timelineItem } = await updateTimelineItem(diary.id, previousItem.id, payload);
        setDiary((current) => {
          if (!current || current.id !== diary.id) return current;
          return {
            ...current,
            timelineItems: current.timelineItems.map((item) =>
              item.id === previousItem.id ? timelineItem : item
            ),
          };
        });
        void refreshMetrics(diary.id);
        toast.success("Event updated.");
      } catch (nextError) {
        setDiary((current) => {
          if (!current || current.id !== diary.id) return current;
          return {
            ...current,
            timelineItems: current.timelineItems.map((item) =>
              item.id === previousItem.id ? previousItem : item
            ),
          };
        });
        toast.error(nextError instanceof Error ? nextError.message : "Failed to update event.");
      }
    },
    [diary, editState, refreshMetrics]
  );

  const handleDeleteEdit = React.useCallback(async () => {
    if (!diary || !editState) return;

    const deletedItem = editState.item;

    setEditState(null);
    setDiary((current) => {
      if (!current || current.id !== diary.id) return current;
      return {
        ...current,
        timelineItems: current.timelineItems.filter((item) => item.id !== deletedItem.id),
      };
    });

    try {
      await deleteTimelineItem(diary.id, deletedItem.id);
      void refreshMetrics(diary.id);
      toast.success("Event deleted.");
    } catch (nextError) {
      setDiary((current) => {
        if (!current || current.id !== diary.id) return current;
        return {
          ...current,
          timelineItems: [...current.timelineItems, deletedItem],
        };
      });
      toast.error(nextError instanceof Error ? nextError.message : "Failed to delete event.");
    }
  }, [diary, editState, refreshMetrics]);

  const handleDayKindChange = React.useCallback(
    async (day: DiaryDay, nextKind: DayKind | null) => {
      if (!diary) return;
      const previous = day.dayKind ?? null;
      if (previous === nextKind) return;

      setDiary((current) => {
        if (!current || current.id !== diary.id) return current;
        return {
          ...current,
          days: current.days.map((entry) =>
            entry.id === day.id ? { ...entry, dayKind: nextKind } : entry
          ),
        };
      });

      try {
        const { day: updatedDay } = await patchDiaryDay(diary.id, day.id, { dayKind: nextKind });
        setDiary((current) => {
          if (!current || current.id !== diary.id) return current;
          return {
            ...current,
            days: current.days.map((entry) => (entry.id === day.id ? updatedDay : entry)),
          };
        });
        toast.success("Day type updated.");
      } catch (nextError) {
        setDiary((current) => {
          if (!current || current.id !== diary.id) return current;
          return {
            ...current,
            days: current.days.map((entry) =>
              entry.id === day.id ? { ...entry, dayKind: previous } : entry
            ),
          };
        });
        toast.error(nextError instanceof Error ? nextError.message : "Failed to update day type.");
      }
    },
    [diary]
  );

  const progress = React.useMemo(() => {
    if (!diary) return 0;
    return getProgress(diary.days, diary.timelineItems);
  }, [diary]);
  const selectedCells = React.useMemo(
    () => (dragState ? getSelectedCells(dragState.anchor, dragState.current) : []),
    [dragState]
  );
  const currentMetric = React.useMemo(() => {
    if (!diary) return null;
    return diary.metrics.find((metric) => metric.diaryWeekId === diary.weeks[0]?.id) ?? null;
  }, [diary]);

  if (!diary) {
    return (
      <DashboardFrame title="Dashboard" description="Create your first 7-day diary to start logging events.">
        {error ? <DashboardError error={error} /> : null}
        <EmptyState creating={creatingDiary} onCreate={handleCreateDiary} />
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame title="Dashboard" description={formatDateRange(diary.startDate, diary.endDate)}>
      {error ? <DashboardError error={error} /> : null}
      <SummaryRow progress={progress} currentMetric={currentMetric} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <EventTypeLegend />
        <QuickLinks diaryId={diary.id} />
      </div>
      <AasmDiaryGrid
        days={diary.days}
        timelineItems={diary.timelineItems}
        selectionDayId={dragState?.day.id ?? null}
        selectedCells={selectedCells}
        onCellPointerDown={handleCellPointerDown}
        onCellPointerEnter={handleCellPointerEnter}
        onDayKindChange={handleDayKindChange}
      />
      <p className="text-sm text-slate-500">
        Editable through {formatHourLabel(getCurrentEditableHourIndex(diary.days[0]?.date ?? diary.startDate))} for the active row.
      </p>
      <EventCreateModal
        key={createState ? `${createState.day.id}-${createState.mode}-${createState.cells.join("-")}` : "create-closed"}
        isOpen={!!createState}
        mode={createState?.mode ?? "point"}
        selectionLabel={createState ? describeSelection(createState) : ""}
        allowedTypes={createState ? getAllowedCreateTypes(createState.cells, createState.mode) : []}
        onClose={() => setCreateState(null)}
        onSubmit={handleCreateEvent}
      />
      <EventEditModal
        key={editState ? `${editState.item.id}-${editState.day.id}` : "edit-closed"}
        isOpen={!!editState}
        item={editState?.item ?? null}
        dayDate={editState?.day.date ?? null}
        onClose={() => setEditState(null)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteEdit}
      />
    </DashboardFrame>
  );
}

function DashboardFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Signed out.");
      router.push("/login");
      router.refresh();
    } catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : "Could not sign out.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <span aria-hidden>←</span>
            Back to dashboard
          </Link>
          <p className="mt-4 text-sm font-medium uppercase tracking-[0.24em] text-indigo-600">Sleepbook</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            7-day AASM log • Week 1 only
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => void handleSignOut()}>
            Sign out
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

function DashboardError({ error }: { error: string }) {
  return (
    <Alert tone="error">
      <AlertTitle>Dashboard error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

function SummaryRow({
  progress,
  currentMetric,
}: {
  progress: number;
  currentMetric: DiaryMetric | null;
}) {
  const cards = [
    ["Progress", `${progress}/7`, "Days with entries"],
    ["Avg bedtime", currentMetric?.averageBedtime ? formatClock(currentMetric.averageBedtime) : "—", "Week 1"],
    ["Avg sleep", currentMetric?.averageTotalSleepTimeMinutes ? formatHours(Number(currentMetric.averageTotalSleepTimeMinutes)) : "—", "Week 1"],
    ["Efficiency", currentMetric?.averageSleepEfficiencyPercent ? `${Math.round(Number(currentMetric.averageSleepEfficiencyPercent))}%` : "—", "Week 1"],
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, hint]) => (
        <div key={label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
      ))}
    </div>
  );
}

function QuickLinks({ diaryId }: { diaryId: string }) {
  const links = [
    ["Weekly metrics", `/dashboard/${diaryId}/metrics`],
    ["All diaries", "/dashboard"],
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([label, href]) => (
        <Link
          key={label}
          href={href}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

function EmptyState({
  creating,
  onCreate,
}: {
  creating: boolean;
  onCreate: (startDate: string) => Promise<void>;
}) {
  const [startDate, setStartDate] = React.useState(getTodayDateInput());

  return (
    <div className="mx-auto w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">Create 7-day diary</p>
      <h2 className="mt-3 font-display text-3xl tracking-tight text-slate-950">Start a new week of logging</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Choose the first day in your 7-day range. Sleepbook will build the full week automatically.
      </p>
      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void onCreate(startDate);
        }}
      >
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className="h-11 flex-1 rounded-2xl border border-slate-300 px-4 text-sm"
          required
        />
        <Button type="submit" size="lg" isLoading={creating}>
          Create 7-day diary
        </Button>
      </form>
    </div>
  );
}

function getAllowedCreateTypes(cells: number[], mode: "point" | "interval") {
  if (mode === "point") {
    return [
      { value: "in_bed", label: "In bed" },
      { value: "caffeine", label: "Caffeine" },
      { value: "alcohol", label: "Alcohol" },
      { value: "medicine", label: "Medicine" },
    ];
  }

  const intervalTypes = [{ value: "exercise", label: "Exercise" }];
  if (cells.every((cell) => isSleepHour(cell))) intervalTypes.unshift({ value: "sleep", label: "Sleep" });
  if (cells.every((cell) => isNapHour(cell))) intervalTypes.unshift({ value: "nap", label: "Nap" });
  return intervalTypes;
}

type CreateTimelinePayload =
  | {
      diaryDayId: string;
      type: TimelineItem["type"];
      timestamp: string;
      label: string | null;
      metadata: Record<string, unknown>;
    }
  | {
      diaryDayId: string;
      type: TimelineItem["type"];
      startTime: string;
      endTime: string;
      label: string | null;
      metadata: Record<string, unknown>;
    };

function buildCreatePayload(state: CreateState, values: { type: string; label: string }): CreateTimelinePayload {
  const start = getCellDateTimeRange(state.day.date, state.cells[0]);
  const end = getCellDateTimeRange(state.day.date, state.cells.at(-1) ?? state.cells[0]);

  if (state.mode === "point") {
    return {
      diaryDayId: state.day.id,
      type: values.type as TimelineItem["type"],
      timestamp: start.startIso,
      label: values.label || null,
      metadata: {},
    };
  }

  if (values.type === "nap") {
    return {
      diaryDayId: state.day.id,
      type: "sleep",
      startTime: start.startIso,
      endTime: end.endIso,
      label: values.label || null,
      metadata: { segment: "nap" },
    };
  }

  return {
    diaryDayId: state.day.id,
    type: values.type as TimelineItem["type"],
    startTime: start.startIso,
    endTime: end.endIso,
    label: values.label || null,
    metadata: {},
  };
}

function buildOptimisticTimelineItem(
  diaryId: string,
  day: DiaryDay,
  payload: CreateTimelinePayload
): TimelineItem {
  const now = new Date().toISOString();

  return {
    id: getOptimisticItemId(),
    diaryId,
    diaryWeekId: day.diaryWeekId,
    diaryDayId: day.id,
    userId: day.userId,
    type: payload.type,
    timestamp: "timestamp" in payload ? payload.timestamp : null,
    startTime: "startTime" in payload ? payload.startTime : null,
    endTime: "endTime" in payload ? payload.endTime : null,
    label: payload.label,
    metadata: payload.metadata,
    createdAt: now,
    updatedAt: now,
  };
}

function applyTimelinePayload(item: TimelineItem, payload: Record<string, unknown>): TimelineItem {
  return {
    ...item,
    ...("timestamp" in payload ? { timestamp: asNullableString(payload.timestamp) } : {}),
    ...("startTime" in payload ? { startTime: asNullableString(payload.startTime) } : {}),
    ...("endTime" in payload ? { endTime: asNullableString(payload.endTime) } : {}),
    ...("label" in payload ? { label: asNullableString(payload.label) } : {}),
    ...("metadata" in payload && isRecord(payload.metadata) ? { metadata: payload.metadata } : {}),
    updatedAt: new Date().toISOString(),
  };
}

function asNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getOptimisticItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `optimistic-${crypto.randomUUID()}`;
  }

  return `optimistic-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canCreateInterval(cells: number[], type: string) {
  if (type === "exercise") return true;
  if (type === "sleep") return cells.every((cell) => isSleepHour(cell));
  if (type === "nap") return cells.every((cell) => isNapHour(cell));
  return false;
}

function describeSelection(state: CreateState) {
  const hours = state.cells.map((cell) => formatHourLabel(cell)).join(" → ");
  return `${state.day.dayOfWeek}, ${state.day.date} • ${hours}`;
}

function getSelectedCells(anchor: number, current: number) {
  const start = Math.min(anchor, current);
  const end = Math.max(anchor, current);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getProgress(days: DiaryDay[], items: TimelineItem[]) {
  const completed = new Set(items.map((item) => item.diaryDayId));
  return days.filter((day) => completed.has(day.id)).length;
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

function formatHourLabel(hourIndex: number) {
  const labels = [
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
  return labels[hourIndex] ?? "Locked";
}

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

