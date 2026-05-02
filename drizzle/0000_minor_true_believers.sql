CREATE TYPE "public"."day_kind" AS ENUM('work', 'school', 'day_off');--> statement-breakpoint
CREATE TYPE "public"."diary_week_number" AS ENUM('week_1', 'week_2');--> statement-breakpoint
CREATE TYPE "public"."timeline_item_type" AS ENUM('sleep', 'nap', 'awake', 'in_bed', 'exercise', 'caffeine', 'alcohol', 'medicine', 'bedtime_marker', 'wake_marker', 'note');--> statement-breakpoint
CREATE TABLE "diaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diaries_two_week_range_check" CHECK ("diaries"."end_date" = "diaries"."start_date" + 13)
);
--> statement-breakpoint
ALTER TABLE "diaries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "diary_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_id" uuid NOT NULL,
	"diary_week_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"day_of_week" text NOT NULL,
	"day_kind" "day_kind" DEFAULT 'day_off' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diary_days_diary_id_date_unique" UNIQUE("diary_id","date")
);
--> statement-breakpoint
ALTER TABLE "diary_days" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "diary_week_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_id" uuid NOT NULL,
	"diary_week_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"average_bedtime" time,
	"average_wake_time" time,
	"average_total_sleep_time_minutes" numeric(6, 2),
	"average_sleep_latency_minutes" numeric(6, 2),
	"average_waso_minutes" numeric(6, 2),
	"average_sleep_efficiency_percent" numeric(5, 2),
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diary_week_metrics_diary_week_id_unique" UNIQUE("diary_week_id"),
	CONSTRAINT "diary_week_metrics_sleep_efficiency_range_check" CHECK ("diary_week_metrics"."average_sleep_efficiency_percent" is null or ("diary_week_metrics"."average_sleep_efficiency_percent" >= 0 and "diary_week_metrics"."average_sleep_efficiency_percent" <= 100))
);
--> statement-breakpoint
ALTER TABLE "diary_week_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "diary_weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_id" uuid NOT NULL,
	"week_number" "diary_week_number" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diary_weeks_diary_id_week_number_unique" UNIQUE("diary_id","week_number"),
	CONSTRAINT "diary_weeks_seven_day_range_check" CHECK ("diary_weeks"."end_date" = "diary_weeks"."start_date" + 6)
);
--> statement-breakpoint
ALTER TABLE "diary_weeks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "timeline_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diary_id" uuid NOT NULL,
	"diary_week_id" uuid NOT NULL,
	"diary_day_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"type" timeline_item_type NOT NULL,
	"timestamp" timestamp with time zone,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"label" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timeline_items_valid_point_or_interval_check" CHECK ((
        ("timeline_items"."timestamp" is not null and "timeline_items"."start_time" is null and "timeline_items"."end_time" is null)
        or
        ("timeline_items"."timestamp" is null and "timeline_items"."start_time" is not null and "timeline_items"."end_time" is not null and "timeline_items"."end_time" > "timeline_items"."start_time")
      ))
);
--> statement-breakpoint
ALTER TABLE "timeline_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "diaries" ADD CONSTRAINT "diaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_days" ADD CONSTRAINT "diary_days_diary_id_diaries_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."diaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_days" ADD CONSTRAINT "diary_days_diary_week_id_diary_weeks_id_fk" FOREIGN KEY ("diary_week_id") REFERENCES "public"."diary_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_days" ADD CONSTRAINT "diary_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_week_metrics" ADD CONSTRAINT "diary_week_metrics_diary_id_diaries_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."diaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_week_metrics" ADD CONSTRAINT "diary_week_metrics_diary_week_id_diary_weeks_id_fk" FOREIGN KEY ("diary_week_id") REFERENCES "public"."diary_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_week_metrics" ADD CONSTRAINT "diary_week_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_weeks" ADD CONSTRAINT "diary_weeks_diary_id_diaries_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."diaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_diary_id_diaries_id_fk" FOREIGN KEY ("diary_id") REFERENCES "public"."diaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_diary_week_id_diary_weeks_id_fk" FOREIGN KEY ("diary_week_id") REFERENCES "public"."diary_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_diary_day_id_diary_days_id_fk" FOREIGN KEY ("diary_day_id") REFERENCES "public"."diary_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diaries_user_id_idx" ON "diaries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "diary_days_diary_id_idx" ON "diary_days" USING btree ("diary_id");--> statement-breakpoint
CREATE INDEX "diary_days_diary_week_id_idx" ON "diary_days" USING btree ("diary_week_id");--> statement-breakpoint
CREATE INDEX "diary_days_user_id_idx" ON "diary_days" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "diary_week_metrics_diary_id_idx" ON "diary_week_metrics" USING btree ("diary_id");--> statement-breakpoint
CREATE INDEX "diary_week_metrics_diary_week_id_idx" ON "diary_week_metrics" USING btree ("diary_week_id");--> statement-breakpoint
CREATE INDEX "diary_weeks_diary_id_idx" ON "diary_weeks" USING btree ("diary_id");--> statement-breakpoint
CREATE INDEX "timeline_items_diary_id_idx" ON "timeline_items" USING btree ("diary_id");--> statement-breakpoint
CREATE INDEX "timeline_items_diary_week_id_idx" ON "timeline_items" USING btree ("diary_week_id");--> statement-breakpoint
CREATE INDEX "timeline_items_diary_day_id_idx" ON "timeline_items" USING btree ("diary_day_id");--> statement-breakpoint
CREATE INDEX "timeline_items_user_id_idx" ON "timeline_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "timeline_items_type_idx" ON "timeline_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "timeline_items_timestamp_idx" ON "timeline_items" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "timeline_items_start_end_time_idx" ON "timeline_items" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE POLICY "diaries_select_own" ON "diaries" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("diaries"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diaries_insert_own" ON "diaries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("diaries"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diaries_update_own" ON "diaries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("diaries"."user_id" = (select auth.uid()::text)) WITH CHECK ("diaries"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diaries_delete_own" ON "diaries" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("diaries"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diary_days_select_own" ON "diary_days" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("diary_days"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diary_days_insert_own" ON "diary_days" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("diary_days"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diary_days_update_own" ON "diary_days" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("diary_days"."user_id" = (select auth.uid()::text)) WITH CHECK ("diary_days"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diary_days_delete_own" ON "diary_days" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("diary_days"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diary_week_metrics_select_own" ON "diary_week_metrics" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("diary_week_metrics"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diary_week_metrics_insert_own" ON "diary_week_metrics" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("diary_week_metrics"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diary_week_metrics_update_own" ON "diary_week_metrics" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("diary_week_metrics"."user_id" = (select auth.uid()::text)) WITH CHECK ("diary_week_metrics"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diary_week_metrics_delete_own" ON "diary_week_metrics" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("diary_week_metrics"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "diary_weeks_select_own" ON "diary_weeks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from diaries
        where diaries.id = "diary_weeks"."diary_id"
          and diaries.user_id = (select auth.uid()::text)
      ));--> statement-breakpoint
CREATE POLICY "diary_weeks_insert_own" ON "diary_weeks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
        select 1 from diaries
        where diaries.id = "diary_weeks"."diary_id"
          and diaries.user_id = (select auth.uid()::text)
      ));--> statement-breakpoint
CREATE POLICY "diary_weeks_update_own" ON "diary_weeks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
        select 1 from diaries
        where diaries.id = "diary_weeks"."diary_id"
          and diaries.user_id = (select auth.uid()::text)
      )) WITH CHECK (exists (
        select 1 from diaries
        where diaries.id = "diary_weeks"."diary_id"
          and diaries.user_id = (select auth.uid()::text)
      ));--> statement-breakpoint
CREATE POLICY "diary_weeks_delete_own" ON "diary_weeks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
        select 1 from diaries
        where diaries.id = "diary_weeks"."diary_id"
          and diaries.user_id = (select auth.uid()::text)
      ));--> statement-breakpoint
CREATE POLICY "timeline_items_select_own" ON "timeline_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("timeline_items"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "timeline_items_insert_own" ON "timeline_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("timeline_items"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "timeline_items_update_own" ON "timeline_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("timeline_items"."user_id" = (select auth.uid()::text)) WITH CHECK ("timeline_items"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "timeline_items_delete_own" ON "timeline_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("timeline_items"."user_id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "users_select_own" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("users"."id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "users_insert_own" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("users"."id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "users_update_own" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("users"."id" = (select auth.uid()::text)) WITH CHECK ("users"."id" = (select auth.uid()::text));--> statement-breakpoint
CREATE POLICY "users_delete_own" ON "users" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("users"."id" = (select auth.uid()::text));