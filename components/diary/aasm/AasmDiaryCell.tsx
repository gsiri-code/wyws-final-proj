import * as React from "react";
import type { TimelineItem } from "@/lib/api/diaries-client";

interface AasmDiaryCellProps {
  item?: TimelineItem;
  editable: boolean;
  selected: boolean;
  onPointerDown: () => void;
  onPointerEnter: () => void;
}

const EVENT_PRESENTATIONS = {
  nap: { code: "N", label: "Nap", className: "bg-violet-200 text-violet-900" },
  sleep: { code: "S", label: "Sleep", className: "bg-indigo-200 text-indigo-950" },
  in_bed: { code: "B", label: "In bed", className: "bg-blue-200 text-blue-950" },
  exercise: { code: "E", label: "Exercise", className: "bg-emerald-200 text-emerald-950" },
  caffeine: { code: "C", label: "Caffeine", className: "bg-yellow-200 text-yellow-950" },
  alcohol: { code: "A", label: "Alcohol", className: "bg-rose-200 text-rose-950" },
  medicine: { code: "M", label: "Medicine", className: "bg-sky-200 text-sky-950" },
} as const;

export const AasmDiaryCell = React.memo(function AasmDiaryCell({
  item,
  editable,
  selected,
  onPointerDown,
  onPointerEnter,
}: AasmDiaryCellProps) {
  const event = item ? getEventPresentation(item) : null;

  const base =
    "flex h-12 items-center justify-center border-r border-b border-slate-300 text-xs font-semibold transition";

  let cellClass: string;
  if (!editable) {
    cellClass = event
      ? `${event.className} cursor-not-allowed opacity-55 saturate-75`
      : "cursor-not-allowed bg-slate-100 text-slate-300";
  } else if (selected) {
    cellClass = "cursor-pointer bg-indigo-100 text-slate-950 ring-2 ring-inset ring-indigo-500";
  } else if (event) {
    cellClass = `cursor-pointer ${event.className} hover:brightness-[0.97]`;
  } else {
    cellClass = "cursor-pointer bg-white hover:bg-slate-50";
  }

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      className={`${base} ${cellClass}`}
      aria-label={event ? event.label : editable ? "Empty editable cell" : "Locked cell"}
    >
      {event?.code ?? ""}
    </button>
  );
});

export function getEventPresentation(item: TimelineItem) {
  if (item.type === "sleep" && item.metadata.segment === "nap") {
    return EVENT_PRESENTATIONS.nap;
  }

  if (item.type === "sleep") {
    return EVENT_PRESENTATIONS.sleep;
  }

  if (item.type === "in_bed") {
    return EVENT_PRESENTATIONS.in_bed;
  }

  if (item.type === "exercise") {
    return EVENT_PRESENTATIONS.exercise;
  }

  if (item.type === "caffeine") {
    return EVENT_PRESENTATIONS.caffeine;
  }

  if (item.type === "alcohol") {
    return EVENT_PRESENTATIONS.alcohol;
  }

  return EVENT_PRESENTATIONS.medicine;
}
