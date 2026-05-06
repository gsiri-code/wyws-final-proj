import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const isoDateSchema = z.string().regex(dateRegex, "Expected YYYY-MM-DD date");
const isoTimestampSchema = z.string().datetime({ offset: true });

const timelineItemTypeValues = [
  "sleep",
  "in_bed",
  "exercise",
  "caffeine",
  "alcohol",
  "medicine",
  "note",
] as const;

export const createDiarySchema = z.object({
  startDate: isoDateSchema,
});

export const updateDiaryDaySchema = z
  .object({
    dayKind: z.enum(["work", "school", "day_off"]).nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((value) => value.dayKind !== undefined || value.notes !== undefined, {
    message: "Provide at least one field to update",
  });

const metadataSchema = z.record(z.string(), z.unknown()).default({});

const pointTimelineSchema = z.object({
  type: z.enum(timelineItemTypeValues),
  timestamp: isoTimestampSchema,
  label: z.string().trim().max(255).nullable().optional(),
  metadata: metadataSchema.optional(),
});

const intervalTimelineSchema = z.object({
  type: z.enum(timelineItemTypeValues),
  startTime: isoTimestampSchema,
  endTime: isoTimestampSchema,
  label: z.string().trim().max(255).nullable().optional(),
  metadata: metadataSchema.optional(),
});

export const createTimelineItemSchema = z
  .object({
    diaryDayId: z.string().uuid(),
  })
  .and(z.union([pointTimelineSchema, intervalTimelineSchema]))
  .superRefine((value, ctx) => {
    if ("timestamp" in value) {
      return;
    }

    if (new Date(value.endTime) <= new Date(value.startTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endTime must be after startTime",
        path: ["endTime"],
      });
    }
  });

export const updateTimelineItemSchema = z
  .union([
    pointTimelineSchema.omit({ type: true }).partial(),
    intervalTimelineSchema.omit({ type: true }).partial(),
  ])
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  })
  .superRefine((value, ctx) => {
    if ("startTime" in value && "endTime" in value && value.startTime && value.endTime) {
      if (new Date(value.endTime) <= new Date(value.startTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endTime must be after startTime",
          path: ["endTime"],
        });
      }
    }
  });
