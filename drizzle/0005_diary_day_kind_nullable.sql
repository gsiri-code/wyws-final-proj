ALTER TABLE "diary_days" ALTER COLUMN "day_kind" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "diary_days" ALTER COLUMN "day_kind" DROP NOT NULL;