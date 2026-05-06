import * as React from "react";
import type { DayKind, DiaryDay, TimelineItem } from "@/lib/api/diaries-client";
import { getGridCellKey, isCellEditable } from "@/lib/diary/aasm-grid";
import { AasmDiaryCell } from "@/components/diary/aasm/AasmDiaryCell";

interface AasmDiaryRowProps {
  day: DiaryDay;
  gridTemplateColumns: string;
  gridItems: Map<string, TimelineItem>;
  selectedCells: Set<number>;
  onCellPointerDown: (day: DiaryDay, hourIndex: number, item?: TimelineItem) => void;
  onCellPointerEnter: (day: DiaryDay, hourIndex: number) => void;
  onDayKindChange: (day: DiaryDay, nextKind: DayKind | null) => void;
}

const HOUR_INDICES = Array.from({ length: 24 }, (_, hourIndex) => hourIndex);
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export const AasmDiaryRow = React.memo(function AasmDiaryRow({
  day,
  gridTemplateColumns,
  gridItems,
  selectedCells,
  onCellPointerDown,
  onCellPointerEnter,
  onDayKindChange,
}: AasmDiaryRowProps) {
  return (
    <div className="grid bg-white" style={{ gridTemplateColumns }}>
      <MetaCell>{formatShortDate(day.date)}</MetaCell>
      <MetaCell>{day.dayOfWeek}</MetaCell>
      <MetaCell className="min-w-[8.5rem]">
        <select
          value={day.dayKind ?? ""}
          onPointerDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            const value = event.target.value;
            onDayKindChange(day, value === "" ? null : (value as DayKind));
          }}
          className="h-9 w-full max-w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800"
          aria-label={`Day type for ${day.dayOfWeek}`}
        >
          <option value="">—</option>
          <option value="work">Work</option>
          <option value="school">School</option>
          <option value="day_off">Day off</option>
        </select>
      </MetaCell>
      {HOUR_INDICES.map((hourIndex) => {
        const item = gridItems.get(getGridCellKey(day.id, hourIndex));
        return (
          <AasmDiaryCell
            key={`${day.id}-${hourIndex}`}
            item={item}
            editable={isCellEditable(day.date, hourIndex)}
            selected={selectedCells.has(hourIndex)}
            onPointerDown={() => onCellPointerDown(day, hourIndex, item)}
            onPointerEnter={() => onCellPointerEnter(day, hourIndex)}
          />
        );
      })}
    </div>
  );
});

function MetaCell({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`flex min-h-12 items-center border-r border-b border-slate-300 px-3 text-sm text-slate-700 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

