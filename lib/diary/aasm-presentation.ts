type TimelineItemPresentation = {
  code: string;
  label: string;
  className: string;
  pdfFillColor: string;
  pdfTextColor: string;
};

type TimelineItemLike = {
  type: string;
  metadata: unknown;
};

const EVENT_PRESENTATIONS = {
  sleep: {
    code: "S",
    label: "Sleep",
    className: "bg-indigo-200 text-indigo-950",
    pdfFillColor: "#c7d2fe",
    pdfTextColor: "#312e81",
  },
  nap: {
    code: "N",
    label: "Nap",
    className: "bg-violet-200 text-violet-900",
    pdfFillColor: "#ddd6fe",
    pdfTextColor: "#5b21b6",
  },
  in_bed: {
    code: "B",
    label: "In bed",
    className: "bg-blue-200 text-blue-950",
    pdfFillColor: "#bfdbfe",
    pdfTextColor: "#1e3a8a",
  },
  exercise: {
    code: "E",
    label: "Exercise",
    className: "bg-emerald-200 text-emerald-950",
    pdfFillColor: "#a7f3d0",
    pdfTextColor: "#065f46",
  },
  caffeine: {
    code: "C",
    label: "Caffeine",
    className: "bg-yellow-200 text-yellow-950",
    pdfFillColor: "#fef08a",
    pdfTextColor: "#854d0e",
  },
  alcohol: {
    code: "A",
    label: "Alcohol",
    className: "bg-rose-200 text-rose-950",
    pdfFillColor: "#fecdd3",
    pdfTextColor: "#9f1239",
  },
  medicine: {
    code: "M",
    label: "Medicine",
    className: "bg-sky-200 text-sky-950",
    pdfFillColor: "#bae6fd",
    pdfTextColor: "#0c4a6e",
  },
} as const satisfies Record<string, TimelineItemPresentation>;

export const AASM_EVENT_LEGEND = [
  EVENT_PRESENTATIONS.sleep,
  EVENT_PRESENTATIONS.nap,
  EVENT_PRESENTATIONS.in_bed,
  EVENT_PRESENTATIONS.exercise,
  EVENT_PRESENTATIONS.caffeine,
  EVENT_PRESENTATIONS.alcohol,
  EVENT_PRESENTATIONS.medicine,
] as const;

export function getTimelineItemPresentation(item: TimelineItemLike): TimelineItemPresentation {
  const metadata = asRecord(item.metadata);

  if (item.type === "sleep" && metadata?.["segment"] === "nap") {
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

export function formatDiaryDayKindLabel(kind: "work" | "school" | "day_off" | null | undefined) {
  if (!kind) {
    return "—";
  }

  const labels = {
    work: "Work",
    school: "School",
    day_off: "Day off",
  } as const;

  return labels[kind];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
