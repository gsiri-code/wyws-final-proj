"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventModalShell } from "@/components/diary/aasm/EventModalShell";

interface EventCreateModalProps {
  isOpen: boolean;
  mode: "point" | "interval";
  selectionLabel: string;
  allowedTypes: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSubmit: (values: { type: string; label: string }) => Promise<unknown>;
}

export function EventCreateModal({
  isOpen,
  mode,
  selectionLabel,
  allowedTypes,
  onClose,
  onSubmit,
}: EventCreateModalProps) {
  const [type, setType] = React.useState(allowedTypes[0]?.value ?? "");
  const [label, setLabel] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  if (!isOpen) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSubmit({ type, label });
    } finally {
      setSaving(false);
    }
  }

  return (
    <EventModalShell
      title={mode === "point" ? "Create event" : "Create timed event"}
      description={selectionLabel}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Event type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
          >
            {allowedTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
          <span>Label</span>
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={mode === "point" ? "Optional note" : "Optional event label"}
            maxLength={255}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            Save event
          </Button>
        </div>
      </form>
    </EventModalShell>
  );
}
