CREATE TYPE "public"."media_status" AS ENUM('pending_upload', 'uploaded', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."upload_batch_status" AS ENUM('created', 'uploading', 'uploaded', 'processing', 'completed', 'completed_with_errors', 'failed');--> statement-breakpoint
CREATE TABLE "upload_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"rally_event_id" integer NOT NULL,
	"album_id" integer NOT NULL,
	"created_by_id" integer,
	"status" "upload_batch_status" DEFAULT 'created' NOT NULL,
	"total_files" integer DEFAULT 0 NOT NULL,
	"processed_files" integer DEFAULT 0 NOT NULL,
	"failed_files" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "media_items" ADD COLUMN "status" "media_status" DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_items" ADD COLUMN "upload_batch_id" integer;--> statement-breakpoint
ALTER TABLE "media_items" ADD COLUMN "original_filename" varchar(255);--> statement-breakpoint
ALTER TABLE "media_items" ADD COLUMN "processing_error" text;--> statement-breakpoint
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_rally_event_id_rally_events_id_fk" FOREIGN KEY ("rally_event_id") REFERENCES "public"."rally_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_batches" ADD CONSTRAINT "upload_batches_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_batches_rally_event_idx" ON "upload_batches" USING btree ("rally_event_id");--> statement-breakpoint
CREATE INDEX "upload_batches_album_idx" ON "upload_batches" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "upload_batches_created_by_idx" ON "upload_batches" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "upload_batches_status_idx" ON "upload_batches" USING btree ("status");--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_upload_batch_id_upload_batches_id_fk" FOREIGN KEY ("upload_batch_id") REFERENCES "public"."upload_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_items_status_idx" ON "media_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "media_items_upload_batch_idx" ON "media_items" USING btree ("upload_batch_id");