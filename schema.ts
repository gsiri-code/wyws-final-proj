import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgSchema,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const dayKindEnum = pgEnum("day_kind", [
  "work",
  "school",
  "day_off",
]);

export const diaryWeekNumberEnum = pgEnum("diary_week_number", [
  "week_1",
  "week_2",
]);

export const timelineItemTypeEnum = pgEnum("timeline_item_type", [
  "sleep",
  "nap",
  "awake",
  "in_bed",
  "exercise",
  "caffeine",
  "alcohol",
  "medicine",
  "bedtime_marker",
  "wake_marker",
  "note",
]);

const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

const currentUserId = sql`(select auth.uid())`;

export const diaries = pgTable(
  "diaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("diaries_user_id_idx").on(table.userId),
    twoWeekRangeCheck: check(
      "diaries_two_week_range_check",
      sql`${table.endDate} = ${table.startDate} + 13`
    ),
    selectOwnDiary: pgPolicy("diaries_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
    }),
    insertOwnDiary: pgPolicy("diaries_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${currentUserId}`,
    }),
    updateOwnDiary: pgPolicy("diaries_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
      withCheck: sql`${table.userId} = ${currentUserId}`,
    }),
    deleteOwnDiary: pgPolicy("diaries_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
    }),
  })
).enableRLS();

export const diaryWeeks = pgTable(
  "diary_weeks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    diaryId: uuid("diary_id")
      .notNull()
      .references(() => diaries.id, { onDelete: "cascade" }),
    weekNumber: diaryWeekNumberEnum("week_number").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    diaryIdIdx: index("diary_weeks_diary_id_idx").on(table.diaryId),
    diaryWeekUnique: unique().on(table.diaryId, table.weekNumber),
    sevenDayRangeCheck: check(
      "diary_weeks_seven_day_range_check",
      sql`${table.endDate} = ${table.startDate} + 6`
    ),
    selectOwnDiaryWeek: pgPolicy("diary_weeks_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from diaries
        where diaries.id = ${table.diaryId}
          and diaries.user_id = ${currentUserId}
      )`,
    }),
    insertOwnDiaryWeek: pgPolicy("diary_weeks_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists (
        select 1 from diaries
        where diaries.id = ${table.diaryId}
          and diaries.user_id = ${currentUserId}
      )`,
    }),
    updateOwnDiaryWeek: pgPolicy("diary_weeks_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from diaries
        where diaries.id = ${table.diaryId}
          and diaries.user_id = ${currentUserId}
      )`,
      withCheck: sql`exists (
        select 1 from diaries
        where diaries.id = ${table.diaryId}
          and diaries.user_id = ${currentUserId}
      )`,
    }),
    deleteOwnDiaryWeek: pgPolicy("diary_weeks_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from diaries
        where diaries.id = ${table.diaryId}
          and diaries.user_id = ${currentUserId}
      )`,
    }),
  })
).enableRLS();

export const diaryDays = pgTable(
  "diary_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    diaryId: uuid("diary_id")
      .notNull()
      .references(() => diaries.id, { onDelete: "cascade" }),
    diaryWeekId: uuid("diary_week_id")
      .notNull()
      .references(() => diaryWeeks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    dayOfWeek: text("day_of_week").notNull(),
    dayKind: dayKindEnum("day_kind").default("day_off").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    diaryDateUnique: unique().on(table.diaryId, table.date),
    diaryIdIdx: index("diary_days_diary_id_idx").on(table.diaryId),
    diaryWeekIdIdx: index("diary_days_diary_week_id_idx").on(table.diaryWeekId),
    userIdIdx: index("diary_days_user_id_idx").on(table.userId),
    selectOwnDiaryDay: pgPolicy("diary_days_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
    }),
    insertOwnDiaryDay: pgPolicy("diary_days_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${currentUserId}`,
    }),
    updateOwnDiaryDay: pgPolicy("diary_days_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
      withCheck: sql`${table.userId} = ${currentUserId}`,
    }),
    deleteOwnDiaryDay: pgPolicy("diary_days_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
    }),
  })
).enableRLS();

export const timelineItems = pgTable(
  "timeline_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    diaryId: uuid("diary_id")
      .notNull()
      .references(() => diaries.id, { onDelete: "cascade" }),
    diaryWeekId: uuid("diary_week_id")
      .notNull()
      .references(() => diaryWeeks.id, { onDelete: "cascade" }),
    diaryDayId: uuid("diary_day_id")
      .notNull()
      .references(() => diaryDays.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: timelineItemTypeEnum("type").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }),
    startTime: timestamp("start_time", { withTimezone: true }),
    endTime: timestamp("end_time", { withTimezone: true }),
    label: text("label"),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    diaryIdIdx: index("timeline_items_diary_id_idx").on(table.diaryId),
    diaryWeekIdIdx: index("timeline_items_diary_week_id_idx").on(table.diaryWeekId),
    diaryDayIdIdx: index("timeline_items_diary_day_id_idx").on(table.diaryDayId),
    userIdIdx: index("timeline_items_user_id_idx").on(table.userId),
    typeIdx: index("timeline_items_type_idx").on(table.type),
    timestampIdx: index("timeline_items_timestamp_idx").on(table.timestamp),
    startEndTimeIdx: index("timeline_items_start_end_time_idx").on(
      table.startTime,
      table.endTime
    ),
    validPointOrIntervalCheck: check(
      "timeline_items_valid_point_or_interval_check",
      sql`(
        (${table.timestamp} is not null and ${table.startTime} is null and ${table.endTime} is null)
        or
        (${table.timestamp} is null and ${table.startTime} is not null and ${table.endTime} is not null and ${table.endTime} > ${table.startTime})
      )`
    ),
    selectOwnTimelineItem: pgPolicy("timeline_items_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
    }),
    insertOwnTimelineItem: pgPolicy("timeline_items_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${currentUserId}`,
    }),
    updateOwnTimelineItem: pgPolicy("timeline_items_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
      withCheck: sql`${table.userId} = ${currentUserId}`,
    }),
    deleteOwnTimelineItem: pgPolicy("timeline_items_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
    }),
  })
).enableRLS();

export const diaryWeekMetrics = pgTable(
  "diary_week_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    diaryId: uuid("diary_id")
      .notNull()
      .references(() => diaries.id, { onDelete: "cascade" }),
    diaryWeekId: uuid("diary_week_id")
      .notNull()
      .references(() => diaryWeeks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    averageBedtime: time("average_bedtime"),
    averageWakeTime: time("average_wake_time"),
    averageTotalSleepTimeMinutes: numeric("average_total_sleep_time_minutes", {
      precision: 6,
      scale: 2,
    }),
    averageSleepLatencyMinutes: numeric("average_sleep_latency_minutes", {
      precision: 6,
      scale: 2,
    }),
    averageWasoMinutes: numeric("average_waso_minutes", {
      precision: 6,
      scale: 2,
    }),
    averageSleepEfficiencyPercent: numeric("average_sleep_efficiency_percent", {
      precision: 5,
      scale: 2,
    }),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    diaryIdIdx: index("diary_week_metrics_diary_id_idx").on(table.diaryId),
    diaryWeekIdIdx: index("diary_week_metrics_diary_week_id_idx").on(table.diaryWeekId),
    diaryWeekUnique: unique().on(table.diaryWeekId),
    sleepEfficiencyRangeCheck: check(
      "diary_week_metrics_sleep_efficiency_range_check",
      sql`${table.averageSleepEfficiencyPercent} is null or (${table.averageSleepEfficiencyPercent} >= 0 and ${table.averageSleepEfficiencyPercent} <= 100)`
    ),
    selectOwnDiaryWeekMetrics: pgPolicy("diary_week_metrics_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
    }),
    insertOwnDiaryWeekMetrics: pgPolicy("diary_week_metrics_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${currentUserId}`,
    }),
    updateOwnDiaryWeekMetrics: pgPolicy("diary_week_metrics_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
      withCheck: sql`${table.userId} = ${currentUserId}`,
    }),
    deleteOwnDiaryWeekMetrics: pgPolicy("diary_week_metrics_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${currentUserId}`,
    }),
  })
).enableRLS();
