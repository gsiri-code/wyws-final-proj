import type { TimelineItem } from "@/lib/api/diaries-client";

interface AasmDiaryCellProps {
  item?: TimelineItem;
  editable: boolean;
  selected: boolean;
  onPointerDown: () => void;
  onPointerEnter: () => void;
}

export function AasmDiaryCell({
  item,
  editable,
  selected,
  onPointerDown,
  onPointerEnter,
}: AasmDiaryCellProps) {
  const event = item ? getEventPresentation(item) : null;

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      className={[
        "flex h-12 items-center justify-center border-r border-b border-slate-300 text-xs font-semibold transition",
        selected ? "bg-indigo-100 ring-2 ring-inset ring-indigo-500" : "bg-white hover:bg-slate-50",
        !editable ? "cursor-not-allowed bg-slate-100 text-slate-300 hover:bg-slate-100" : "cursor-pointer",
        event?.className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={event ? event.label : editable ? "Empty editable cell" : "Locked cell"}
    >
      {event?.code ?? ""}
    </button>
  );
}

export function getEventPresentation(item: TimelineItem) {
  if (item.type === "sleep" && item.metadata.segment === "nap") {
    return { code: "N", label: "Nap", className: "bg-violet-200 text-violet-900" };
  }

  if (item.type === "sleep") {
    return { code: "S", label: "Sleep", className: "bg-indigo-200 text-indigo-950" };
  }

  if (item.type === "in_bed") {
    return { code: "B", label: "In bed", className: "bg-amber-200 text-amber-950" };
  }

  if (item.type === "exercise") {
    return { code: "E", label: "Exercise", className: "bg-emerald-200 text-emerald-950" };
  }

  if (item.type === "caffeine") {
    return { code: "C", label: "Caffeine", className: "bg-yellow-200 text-yellow-950" };
  }

  if (item.type === "alcohol") {
    return { code: "A", label: "Alcohol", className: "bg-rose-200 text-rose-950" };
  }

  return { code: "M", label: "Medicine", className: "bg-sky-200 text-sky-950" };
}
