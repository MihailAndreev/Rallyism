CREATE TYPE "public"."championship" AS ENUM('WRC', 'ERC', 'national', 'other');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('photo', 'video');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'public', 'unlisted');--> statement-breakpoint
CREATE TABLE "albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"rally_event_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"album_date" date,
	"cover_image_url" text,
	"cover_image_r2_key" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"media_item_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_item_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"album_id" integer NOT NULL,
	"rally_event_id" integer NOT NULL,
	"type" "media_type" NOT NULL,
	"title" varchar(180),
	"caption" text,
	"date_taken" timestamp with time zone,
	"location" varchar(180),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by_id" integer,
	"original_image_url" text,
	"original_image_r2_key" text,
	"thumbnail_image_url" text,
	"thumbnail_image_r2_key" text,
	"display_image_url" text,
	"display_image_r2_key" text,
	"mime_type" varchar(120),
	"file_size_bytes" integer,
	"width" integer,
	"height" integer,
	"aspect_ratio" numeric(8, 4),
	"youtube_url" text,
	"youtube_video_id" varchar(32),
	"youtube_thumbnail_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_tags" (
	"media_item_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "media_tags_media_item_id_tag_id_pk" PRIMARY KEY("media_item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "rally_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(180) NOT NULL,
	"rally_name" varchar(180) NOT NULL,
	"championship" "championship" DEFAULT 'other' NOT NULL,
	"season_year" integer NOT NULL,
	"country" varchar(120) NOT NULL,
	"region" varchar(180),
	"start_date" date,
	"end_date" date,
	"description" text,
	"cover_image_url" text,
	"cover_image_r2_key" text,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(120) NOT NULL,
	"photo_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"password_reset_token_hash" varchar(255),
	"password_reset_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_rally_event_id_rally_events_id_fk" FOREIGN KEY ("rally_event_id") REFERENCES "public"."rally_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_comments" ADD CONSTRAINT "media_comments_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_comments" ADD CONSTRAINT "media_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_rally_event_id_rally_events_id_fk" FOREIGN KEY ("rally_event_id") REFERENCES "public"."rally_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_media_item_id_media_items_id_fk" FOREIGN KEY ("media_item_id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_tags" ADD CONSTRAINT "media_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rally_events" ADD CONSTRAINT "rally_events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "albums_rally_event_idx" ON "albums" USING btree ("rally_event_id");--> statement-breakpoint
CREATE INDEX "albums_created_by_idx" ON "albums" USING btree ("created_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_media_idx" ON "favorites" USING btree ("user_id","media_item_id");--> statement-breakpoint
CREATE INDEX "favorites_media_item_idx" ON "favorites" USING btree ("media_item_id");--> statement-breakpoint
CREATE INDEX "media_comments_media_item_idx" ON "media_comments" USING btree ("media_item_id");--> statement-breakpoint
CREATE INDEX "media_comments_user_idx" ON "media_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_items_rally_event_idx" ON "media_items" USING btree ("rally_event_id");--> statement-breakpoint
CREATE INDEX "media_items_album_idx" ON "media_items" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "media_items_type_idx" ON "media_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "media_items_created_by_idx" ON "media_items" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "media_tags_tag_idx" ON "media_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "rally_events_year_country_championship_idx" ON "rally_events" USING btree ("season_year","country","championship");--> statement-breakpoint
CREATE INDEX "rally_events_visibility_idx" ON "rally_events" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "rally_events_created_by_idx" ON "rally_events" USING btree ("created_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");