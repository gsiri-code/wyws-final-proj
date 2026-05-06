import * as React from "react";
import type { TimelineItem } from "@/lib/api/diaries-client";
import { getTimelineItemPresentation } from "@/lib/diary/aasm-presentation";

interface AasmDiaryCellProps {
  item?: TimelineItem;
  editable: boolean;
  selected: boolean;
  onPointerDown: () => void;
  onPointerEnter: () => void;
}

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
  return getTimelineItemPresentation(item);
}
