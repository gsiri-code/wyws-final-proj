-- Supabase owns the `auth` schema (including `auth.users`). Drizzle must not
-- attempt to move/create tables there. If a legacy `public.users` table exists
-- from an earlier iteration, drop it and re-point FKs to `auth.users`.
ALTER TABLE "diaries" DROP CONSTRAINT IF EXISTS "diaries_user_id_users_id_fk";
ALTER TABLE "diary_days" DROP CONSTRAINT IF EXISTS "diary_days_user_id_users_id_fk";
ALTER TABLE "diary_week_metrics" DROP CONSTRAINT IF EXISTS "diary_week_metrics_user_id_users_id_fk";
ALTER TABLE "timeline_items" DROP CONSTRAINT IF EXISTS "timeline_items_user_id_users_id_fk";
DROP TABLE IF EXISTS "public"."users";
--> statement-breakpoint
DROP POLICY IF EXISTS "diaries_select_own" ON "diaries";
DROP POLICY IF EXISTS "diaries_insert_own" ON "diaries";
DROP POLICY IF EXISTS "diaries_update_own" ON "diaries";
DROP POLICY IF EXISTS "diaries_delete_own" ON "diaries";
DROP POLICY IF EXISTS "diary_days_select_own" ON "diary_days";
DROP POLICY IF EXISTS "diary_days_insert_own" ON "diary_days";
DROP POLICY IF EXISTS "diary_days_update_own" ON "diary_days";
DROP POLICY IF EXISTS "diary_days_delete_own" ON "diary_days";
DROP POLICY IF EXISTS "diary_week_metrics_select_own" ON "diary_week_metrics";
DROP POLICY IF EXISTS "diary_week_metrics_insert_own" ON "diary_week_metrics";
DROP POLICY IF EXISTS "diary_week_metrics_update_own" ON "diary_week_metrics";
DROP POLICY IF EXISTS "diary_week_metrics_delete_own" ON "diary_week_metrics";
DROP POLICY IF EXISTS "diary_weeks_select_own" ON "diary_weeks";
DROP POLICY IF EXISTS "diary_weeks_insert_own" ON "diary_weeks";
DROP POLICY IF EXISTS "diary_weeks_update_own" ON "diary_weeks";
DROP POLICY IF EXISTS "diary_weeks_delete_own" ON "diary_weeks";
DROP POLICY IF EXISTS "timeline_items_select_own" ON "timeline_items";
DROP POLICY IF EXISTS "timeline_items_insert_own" ON "timeline_items";
DROP POLICY IF EXISTS "timeline_items_update_own" ON "timeline_items";
DROP POLICY IF EXISTS "timeline_items_delete_own" ON "timeline_items";
--> statement-breakpoint
ALTER TABLE "timeline_items" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."timeline_item_type";--> statement-breakpoint
CREATE TYPE "public"."timeline_item_type" AS ENUM('sleep', 'in_bed', 'exercise', 'caffeine', 'alcohol', 'medicine', 'note');--> statement-breakpoint
ALTER TABLE "timeline_items" ALTER COLUMN "type" SET DATA TYPE timeline_item_type USING "type"::timeline_item_type;--> statement-breakpoint
ALTER TABLE "diaries" ALTER COLUMN "user_id" TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "diary_days" ALTER COLUMN "user_id" TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "diary_week_metrics" ALTER COLUMN "user_id" TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "timeline_items" ALTER COLUMN "user_id" TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "diaries" ADD CONSTRAINT "diaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_days" ADD CONSTRAINT "diary_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_week_metrics" ADD CONSTRAINT "diary_week_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_items" ADD CONSTRAINT "timeline_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "diaries_select_own" ON "diaries" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("diaries"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "diaries_insert_own" ON "diaries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("diaries"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "diaries_update_own" ON "diaries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("diaries"."user_id" = (select auth.uid())) WITH CHECK ("diaries"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "diaries_delete_own" ON "diaries" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("diaries"."user_id" = (select auth.uid()));--> statement-breakpoint

CREATE POLICY "diary_days_select_own" ON "diary_days" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("diary_days"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "diary_days_insert_own" ON "diary_days" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("diary_days"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "diary_days_update_own" ON "diary_days" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("diary_days"."user_id" = (select auth.uid())) WITH CHECK ("diary_days"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "diary_days_delete_own" ON "diary_days" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("diary_days"."user_id" = (select auth.uid()));--> statement-breakpoint

CREATE POLICY "diary_week_metrics_select_own" ON "diary_week_metrics" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("diary_week_metrics"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "diary_week_metrics_insert_own" ON "diary_week_metrics" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("diary_week_metrics"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "diary_week_metrics_update_own" ON "diary_week_metrics" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("diary_week_metrics"."user_id" = (select auth.uid())) WITH CHECK ("diary_week_metrics"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "diary_week_metrics_delete_own" ON "diary_week_metrics" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("diary_week_metrics"."user_id" = (select auth.uid()));--> statement-breakpoint

CREATE POLICY "diary_weeks_select_own" ON "diary_weeks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
  select 1 from diaries
  where diaries.id = "diary_weeks"."diary_id"
    and diaries.user_id = (select auth.uid())
));--> statement-breakpoint
CREATE POLICY "diary_weeks_insert_own" ON "diary_weeks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
  select 1 from diaries
  where diaries.id = "diary_weeks"."diary_id"
    and diaries.user_id = (select auth.uid())
));--> statement-breakpoint
CREATE POLICY "diary_weeks_update_own" ON "diary_weeks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
  select 1 from diaries
  where diaries.id = "diary_weeks"."diary_id"
    and diaries.user_id = (select auth.uid())
)) WITH CHECK (exists (
  select 1 from diaries
  where diaries.id = "diary_weeks"."diary_id"
    and diaries.user_id = (select auth.uid())
));--> statement-breakpoint
CREATE POLICY "diary_weeks_delete_own" ON "diary_weeks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
  select 1 from diaries
  where diaries.id = "diary_weeks"."diary_id"
    and diaries.user_id = (select auth.uid())
));--> statement-breakpoint

CREATE POLICY "timeline_items_select_own" ON "timeline_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("timeline_items"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "timeline_items_insert_own" ON "timeline_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("timeline_items"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "timeline_items_update_own" ON "timeline_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("timeline_items"."user_id" = (select auth.uid())) WITH CHECK ("timeline_items"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "timeline_items_delete_own" ON "timeline_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("timeline_items"."user_id" = (select auth.uid()));