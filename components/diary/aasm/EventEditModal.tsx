"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TimelineItem } from "@/lib/api/diaries-client";
import {
  getCellDateTimeRange,
  getCellsForTimelineItem,
  getDiaryHourLabels,
} from "@/lib/diary/aasm-grid";
import { EventModalShell } from "@/components/diary/aasm/EventModalShell";

interface EventEditModalProps {
  isOpen: boolean;
  item: TimelineItem | null;
  dayDate: string | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}

export function EventEditModal({
  isOpen,
  item,
  dayDate,
  onClose,
  onSave,
  onDelete,
}: EventEditModalProps) {
  const cells = React.useMemo(
    () => (item && dayDate ? getCellsForTimelineItem(item, dayDate) : []),
    [dayDate, item]
  );
  const [label, setLabel] = React.useState(item?.label ?? "");
  const [pointHour, setPointHour] = React.useState(cells[0] ?? 0);
  const [startHour, setStartHour] = React.useState(cells[0] ?? 0);
  const [endHour, setEndHour] = React.useState(cells.at(-1) ?? 0);
  const [sleepKind, setSleepKind] = React.useState<"sleep" | "nap">(
    getSleepKind(item)
  );
  const [saving, setSaving] = React.useState(false);

  if (!isOpen || !item || !dayDate) return null;

  const currentItem = item;
  const currentDayDate = dayDate;

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSave(
        buildPayload(currentItem, currentDayDate, {
          label,
          pointHour,
          startHour,
          endHour,
          sleepKind,
        })
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await onDelete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <EventModalShell title="Edit event" description="Adjust the time, label, or metadata." onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSave}>
        {item.timestamp ? (
          <HourSelect label="Hour" value={pointHour} onChange={setPointHour} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <HourSelect label="Start hour" value={startHour} onChange={setStartHour} />
            <HourSelect label="End hour" value={endHour} onChange={setEndHour} />
          </div>
        )}
        {item.type === "sleep" ? (
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">
            <span>Sleep kind</span>
            <select
              value={sleepKind}
              onChange={(event) => setSleepKind(event.target.value as "sleep" | "nap")}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="sleep">Sleep</option>
              <option value="nap">Nap</option>
            </select>
          </label>
        ) : null}
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Label</span>
          <Input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={255} />
        </label>
        <div className="flex justify-between gap-2">
          <Button type="button" variant="ghost" onClick={handleDelete} isLoading={saving}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </EventModalShell>
  );
}

function HourSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
      >
        {getDiaryHourLabels().map((hourLabel, hourIndex) => (
          <option key={`${label}-${hourLabel}`} value={hourIndex}>
            {hourLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildPayload(
  item: TimelineItem,
  dayDate: string,
  values: {
    label: string;
    pointHour: number;
    startHour: number;
    endHour: number;
    sleepKind: "sleep" | "nap";
  }
) {
  const payload: Record<string, unknown> = {
    label: values.label || null,
    metadata: buildMetadata(item, values.sleepKind),
  };

  if (item.timestamp) {
    payload.timestamp = getCellDateTimeRange(dayDate, values.pointHour).startIso;
    return payload;
  }

  payload.startTime = getCellDateTimeRange(dayDate, Math.min(values.startHour, values.endHour)).startIso;
  payload.endTime = getCellDateTimeRange(dayDate, Math.max(values.startHour, values.endHour)).endIso;
  return payload;
}

function buildMetadata(item: TimelineItem, sleepKind: "sleep" | "nap") {
  if (item.type !== "sleep") return item.metadata;
  const metadata = { ...item.metadata };
  if (sleepKind === "nap") metadata.segment = "nap";
  if (sleepKind === "sleep") delete metadata.segment;
  return metadata;
}

function getSleepKind(item: TimelineItem | null): "sleep" | "nap" {
  return item?.type === "sleep" && item.metadata.segment === "nap" ? "nap" : "sleep";
}
