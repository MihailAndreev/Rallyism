CREATE TYPE "public"."album_visibility" AS ENUM('private', 'public');--> statement-breakpoint
ALTER TABLE "albums" ADD COLUMN "visibility" "album_visibility" DEFAULT 'private' NOT NULL;--> statement-breakpoint
UPDATE "albums"
SET "visibility" = CASE
  WHEN "rally_events"."visibility" IN ('public', 'unlisted') THEN 'public'::"album_visibility"
  ELSE 'private'::"album_visibility"
END
FROM "rally_events"
WHERE "albums"."rally_event_id" = "rally_events"."id";--> statement-breakpoint
CREATE INDEX "albums_visibility_idx" ON "albums" USING btree ("visibility");
