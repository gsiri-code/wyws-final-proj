import * as React from "react";
import type { DayKind, DiaryDay, TimelineItem } from "@/lib/api/diaries-client";
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
  onDayKindChange: (day: DiaryDay, nextKind: DayKind | null) => void;
}

const gridTemplateColumns = "7.5rem 8rem 8rem repeat(24, minmax(2.8rem, 1fr))";
const EMPTY_SELECTION = new Set<number>();

export const AasmDiaryGrid = React.memo(function AasmDiaryGrid({
  days,
  timelineItems,
  selectionDayId,
  selectedCells,
  onCellPointerDown,
  onCellPointerEnter,
  onDayKindChange,
}: AasmDiaryGridProps) {
  const gridItems = React.useMemo(() => mapTimelineItemsToGrid(days, timelineItems), [days, timelineItems]);
  const selectionSet = React.useMemo(() => new Set(selectedCells), [selectedCells]);

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
              selectedCells={selectionDayId === day.id ? selectionSet : EMPTY_SELECTION}
              onCellPointerDown={onCellPointerDown}
              onCellPointerEnter={onCellPointerEnter}
              onDayKindChange={onDayKindChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
