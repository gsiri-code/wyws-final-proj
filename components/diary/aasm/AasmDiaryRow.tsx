import type { DiaryDay, TimelineItem } from "@/lib/api/diaries-client";
import { getGridCellKey, isCellEditable } from "@/lib/diary/aasm-grid";
import { AasmDiaryCell } from "@/components/diary/aasm/AasmDiaryCell";

interface AasmDiaryRowProps {
  day: DiaryDay;
  gridTemplateColumns: string;
  gridItems: Map<string, TimelineItem>;
  selectedCells: Set<number>;
  onCellPointerDown: (day: DiaryDay, hourIndex: number, item?: TimelineItem) => void;
  onCellPointerEnter: (day: DiaryDay, hourIndex: number) => void;
}

export function AasmDiaryRow({
  day,
  gridTemplateColumns,
  gridItems,
  selectedCells,
  onCellPointerDown,
  onCellPointerEnter,
}: AasmDiaryRowProps) {
  return (
    <div className="grid bg-white" style={{ gridTemplateColumns }}>
      <MetaCell>{formatShortDate(day.date)}</MetaCell>
      <MetaCell>{day.dayOfWeek}</MetaCell>
      <MetaCell>{formatDayKind(day.dayKind)}</MetaCell>
      {Array.from({ length: 24 }, (_, hourIndex) => {
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
}

function MetaCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center border-r border-b border-slate-300 px-3 text-sm text-slate-700">
      {children}
    </div>
  );
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDayKind(value: DiaryDay["dayKind"]) {
  if (value === "day_off") return "Day off";
  return value[0].toUpperCase() + value.slice(1);
}
