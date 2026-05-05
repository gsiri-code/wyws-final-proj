import { getDiaryHourLabels } from "@/lib/diary/aasm-grid";

interface AasmDiaryHeaderProps {
  gridTemplateColumns: string;
}

export function AasmDiaryHeader({ gridTemplateColumns }: AasmDiaryHeaderProps) {
  return (
    <div
      className="grid border-b border-slate-400 bg-slate-100"
      style={{ gridTemplateColumns }}
    >
      <HeaderCell>DATE</HeaderCell>
      <HeaderCell>DAY</HeaderCell>
      <HeaderCell>TYPE</HeaderCell>
      {getDiaryHourLabels().map((label) => (
        <div
          key={label}
          className="flex h-20 items-end justify-center border-r border-slate-300 px-1 pb-2 text-[11px] font-semibold text-slate-700"
        >
          <span
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center border-r border-slate-300 px-3 text-[11px] font-bold tracking-[0.18em] text-slate-600">
      {children}
    </div>
  );
}
