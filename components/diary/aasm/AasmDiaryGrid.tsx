import type { DiaryDay, TimelineItem } from "@/lib/api/diaries-client";
import { mapTimelineItemsToGrid } from "@/lib/diary/aasm-grid";
import { AasmDiaryHeader } from "@/components/diary/aasm/AasmDiaryHeader";
import { AasmDiaryRow } from "@/components/diary/aasm/AasmDiaryRow";

interface AasmDiaryGridProps {
  days: DiaryDay[];
  timelineItems: TimelineItem[];
  selectionDayId: string | null;
  selectedCells: number[];
  onCellPointerDown: (day: DiaryDay, hourIndex: number, item?: TimelineItem) => void;
  onCellPointerEnter: (day: DiaryDay, hourIndex: number) => void;
}

const gridTemplateColumns = "7.5rem 8rem 8rem repeat(24, minmax(2.8rem, 1fr))";

export function AasmDiaryGrid({
  days,
  timelineItems,
  selectionDayId,
  selectedCells,
  onCellPointerDown,
  onCellPointerEnter,
}: AasmDiaryGridProps) {
  const gridItems = mapTimelineItemsToGrid(days, timelineItems);
  const selectionSet = new Set(selectedCells);

  return (
    <div className="flex gap-3">
      <div className="min-w-0 flex-1 overflow-x-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="min-w-[1100px]">
          <AasmDiaryHeader gridTemplateColumns={gridTemplateColumns} />
          {days.map((day) => (
            <AasmDiaryRow
              key={day.id}
              day={day}
              gridTemplateColumns={gridTemplateColumns}
              gridItems={gridItems}
              selectedCells={selectionDayId === day.id ? selectionSet : new Set<number>()}
              onCellPointerDown={onCellPointerDown}
              onCellPointerEnter={onCellPointerEnter}
            />
          ))}
        </div>
      </div>
      <div className="hidden shrink-0 items-center lg:flex">
        <div className="flex h-full min-h-[420px] items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-6 shadow-sm">
          <span className="h-full w-px bg-slate-300" />
          <span
            className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Week 1 only
          </span>
        </div>
      </div>
    </div>
  );
}
