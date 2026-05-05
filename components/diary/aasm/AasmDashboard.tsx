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
import {
  createDiary,
  createTimelineItem,
  deleteTimelineItem,
  getDiary,
  recalculateMetrics,
  updateTimelineItem,
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
  const router = useRouter();
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

  async function refreshDiary(diaryId = diary?.id) {
    if (!diaryId) return;
    setError(null);

    try {
      const [{ diary: nextDiary }, { metrics }] = await Promise.all([
        getDiary(diaryId),
        recalculateMetrics(diaryId),
      ]);
      setDiary({ ...nextDiary, metrics });
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to refresh diary.");
    }
  }

  function handleCellPointerDown(day: DiaryDay, hourIndex: number, item?: TimelineItem) {
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
  }

  function handleCellPointerEnter(day: DiaryDay, hourIndex: number) {
    setDragState((current) => {
      if (!current || current.day.id !== day.id || !isCellEditable(day.date, hourIndex)) return current;
      return {
        ...current,
        current: hourIndex,
        moved: current.moved || current.anchor !== hourIndex,
      };
    });
  }

  async function handleCreateDiary(startDate: string) {
    setCreatingDiary(true);
    setError(null);

    try {
      const { diary: nextDiary } = await createDiary(startDate);
      setDiary(nextDiary);
      toast.success("7-day diary created.");
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create diary.");
    } finally {
      setCreatingDiary(false);
    }
  }

  async function handleCreateEvent(values: { type: string; label: string }) {
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

    try {
      await createTimelineItem(diary.id, buildCreatePayload(createState, values));
      setCreateState(null);
      toast.success("Event added.");
      await refreshDiary();
    } catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to add event.");
    }
  }

  async function handleSaveEdit(payload: Record<string, unknown>) {
    if (!diary || !editState) return;
    const previewItem = { ...editState.item, ...payload } as TimelineItem;
    const previewCells = getCellsForTimelineItem(previewItem, editState.day.date);
    const dayItems = diary.timelineItems.filter((item) => item.diaryDayId === editState.day.id);

    if (hasOverlap(previewCells, dayItems, editState.day.date, editState.item.id)) {
      toast.error("The updated event overlaps an existing entry.");
      return;
    }

    try {
      await updateTimelineItem(diary.id, editState.item.id, payload);
      setEditState(null);
      toast.success("Event updated.");
      await refreshDiary();
    } catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to update event.");
    }
  }

  async function handleDeleteEdit() {
    if (!diary || !editState) return;

    try {
      await deleteTimelineItem(diary.id, editState.item.id);
      setEditState(null);
      toast.success("Event deleted.");
      await refreshDiary();
    } catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : "Failed to delete event.");
    }
  }

  if (!diary) {
    return (
      <DashboardFrame title="Dashboard" description="Create your first 7-day diary to start logging events.">
        {error ? <DashboardError error={error} /> : null}
        <EmptyState creating={creatingDiary} onCreate={handleCreateDiary} />
      </DashboardFrame>
    );
  }

  const progress = getProgress(diary.days, diary.timelineItems);
  const selectedCells = dragState ? getSelectedCells(dragState.anchor, dragState.current) : [];
  const currentMetric = diary.metrics.find((metric) => metric.diaryWeekId === diary.weeks[0]?.id) ?? null;

  return (
    <DashboardFrame title="Dashboard" description={formatDateRange(diary.startDate, diary.endDate)}>
      {error ? <DashboardError error={error} /> : null}
      <SummaryRow progress={progress} currentMetric={currentMetric} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <EventTypeLegend />
        <QuickLinks />
      </div>
      <AasmDiaryGrid
        days={diary.days}
        timelineItems={diary.timelineItems}
        selectionDayId={dragState?.day.id ?? null}
        selectedCells={selectedCells}
        onCellPointerDown={handleCellPointerDown}
        onCellPointerEnter={handleCellPointerEnter}
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
  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-indigo-600">Sleepbook</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          7-day AASM log • Week 1 only
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
    ["Avg sleep", currentMetric?.averageTotalSleepTimeMinutes ? `${Math.round(Number(currentMetric.averageTotalSleepTimeMinutes))} min` : "—", "Week 1"],
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

function QuickLinks() {
  const links = [
    ["History", "/dashboard#history"],
    ["Analytics", "/dashboard#analytics"],
    ["Reports", "/dashboard#reports"],
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

function buildCreatePayload(state: CreateState, values: { type: string; label: string }) {
  const start = getCellDateTimeRange(state.day.date, state.cells[0]);
  const end = getCellDateTimeRange(state.day.date, state.cells.at(-1) ?? state.cells[0]);

  if (state.mode === "point") {
    return {
      diaryDayId: state.day.id,
      type: values.type,
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
    type: values.type,
    startTime: start.startIso,
    endTime: end.endIso,
    label: values.label || null,
    metadata: {},
  };
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
