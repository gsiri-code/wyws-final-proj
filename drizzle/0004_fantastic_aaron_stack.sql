ALTER TABLE "diary_weeks" DROP CONSTRAINT "diary_weeks_diary_id_week_number_unique";--> statement-breakpoint
ALTER TABLE "diary_weeks" DROP COLUMN "week_number";--> statement-breakpoint
ALTER TABLE "diary_weeks" ADD CONSTRAINT "diary_weeks_diary_id_unique" UNIQUE("diary_id");--> statement-breakpoint
DROP TYPE "public"."diary_week_number";