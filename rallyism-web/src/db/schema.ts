import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userApprovalStatusEnum = pgEnum("user_approval_status", [
  "pending",
  "approved",
  "rejected",
]);
export const championshipEnum = pgEnum("championship", [
  "WRC",
  "ERC",
  "national",
  "other",
]);
export const visibilityEnum = pgEnum("visibility", [
  "private",
  "public",
  "unlisted",
]);
export const albumVisibilityEnum = pgEnum("album_visibility", [
  "private",
  "public",
]);
export const mediaTypeEnum = pgEnum("media_type", ["photo", "video"]);
export const uploadBatchStatusEnum = pgEnum("upload_batch_status", [
  "created",
  "uploading",
  "uploaded",
  "processing",
  "completed",
  "completed_with_errors",
  "failed",
]);
export const mediaStatusEnum = pgEnum("media_status", [
  "pending_upload",
  "uploaded",
  "processing",
  "ready",
  "failed",
]);

// App users. Regular users can view allowed memories; admins manage content and users.
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    photoUrl: text("photo_url"),
    role: userRoleEnum("role").notNull().default("user"),
    approvalStatus: userApprovalStatusEnum("approval_status")
      .notNull()
      .default("pending"),
    passwordResetTokenHash: varchar("password_reset_token_hash", {
      length: 255,
    }),
    passwordResetExpiresAt: timestamp("password_reset_expires_at", {
      withTimezone: true,
    }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

// High-level rally memories such as a rally event, trip, or season stop.
export const rallyEvents = pgTable(
  "rally_events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 180 }).notNull(),
    rallyName: varchar("rally_name", { length: 180 }).notNull(),
    championship: championshipEnum("championship").notNull().default("other"),
    seasonYear: integer("season_year").notNull(),
    country: varchar("country", { length: 120 }).notNull(),
    region: varchar("region", { length: 180 }),
    startDate: date("start_date"),
    endDate: date("end_date"),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    coverImageR2Key: text("cover_image_r2_key"),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    featured: boolean("featured").notNull().default(false),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("rally_events_year_country_championship_idx").on(
      table.seasonYear,
      table.country,
      table.championship,
    ),
    index("rally_events_visibility_idx").on(table.visibility),
    index("rally_events_created_by_idx").on(table.createdById),
  ],
);

// Albums group photos and YouTube videos inside one rally event.
export const albums = pgTable(
  "albums",
  {
    id: serial("id").primaryKey(),
    rallyEventId: integer("rally_event_id")
      .notNull()
      .references(() => rallyEvents.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    albumDate: date("album_date"),
    coverImageUrl: text("cover_image_url"),
    coverImageR2Key: text("cover_image_r2_key"),
    visibility: albumVisibilityEnum("visibility").notNull().default("private"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("albums_rally_event_idx").on(table.rallyEventId),
    index("albums_visibility_idx").on(table.visibility),
    index("albums_created_by_idx").on(table.createdById),
  ],
);

// Upload batches track server-side photo processing and R2 storage results.
export const uploadBatches = pgTable(
  "upload_batches",
  {
    id: serial("id").primaryKey(),
    rallyEventId: integer("rally_event_id")
      .notNull()
      .references(() => rallyEvents.id, { onDelete: "cascade" }),
    albumId: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: uploadBatchStatusEnum("status").notNull().default("created"),
    totalFiles: integer("total_files").notNull().default(0),
    processedFiles: integer("processed_files").notNull().default(0),
    failedFiles: integer("failed_files").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("upload_batches_rally_event_idx").on(table.rallyEventId),
    index("upload_batches_album_idx").on(table.albumId),
    index("upload_batches_created_by_idx").on(table.createdById),
    index("upload_batches_status_idx").on(table.status),
  ],
);

// Media items hold shared fields plus photo metadata or YouTube metadata depending on type.
export const mediaItems = pgTable(
  "media_items",
  {
    id: serial("id").primaryKey(),
    albumId: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    rallyEventId: integer("rally_event_id")
      .notNull()
      .references(() => rallyEvents.id, { onDelete: "cascade" }),
    type: mediaTypeEnum("type").notNull(),
    status: mediaStatusEnum("status").notNull().default("ready"),
    title: varchar("title", { length: 180 }),
    caption: text("caption"),
    dateTaken: timestamp("date_taken", { withTimezone: true }),
    location: varchar("location", { length: 180 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    uploadBatchId: integer("upload_batch_id").references(() => uploadBatches.id, {
      onDelete: "set null",
    }),
    originalFilename: varchar("original_filename", { length: 255 }),
    processingError: text("processing_error"),
    originalImageUrl: text("original_image_url"),
    originalImageR2Key: text("original_image_r2_key"),
    thumbnailImageUrl: text("thumbnail_image_url"),
    thumbnailImageR2Key: text("thumbnail_image_r2_key"),
    displayImageUrl: text("display_image_url"),
    displayImageR2Key: text("display_image_r2_key"),
    mimeType: varchar("mime_type", { length: 120 }),
    fileSizeBytes: integer("file_size_bytes"),
    width: integer("width"),
    height: integer("height"),
    aspectRatio: numeric("aspect_ratio", { precision: 8, scale: 4 }),
    youtubeUrl: text("youtube_url"),
    youtubeVideoId: varchar("youtube_video_id", { length: 32 }),
    youtubeThumbnailUrl: text("youtube_thumbnail_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("media_items_rally_event_idx").on(table.rallyEventId),
    index("media_items_album_idx").on(table.albumId),
    index("media_items_type_idx").on(table.type),
    index("media_items_status_idx").on(table.status),
    index("media_items_created_by_idx").on(table.createdById),
    index("media_items_upload_batch_idx").on(table.uploadBatchId),
  ],
);

// Reusable labels for filtering and search.
export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("tags_slug_idx").on(table.slug)],
);

export const mediaTags = pgTable(
  "media_tags",
  {
    mediaItemId: integer("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.mediaItemId, table.tagId] }),
    index("media_tags_tag_idx").on(table.tagId),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mediaItemId: integer("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("favorites_user_media_idx").on(table.userId, table.mediaItemId),
    index("favorites_media_item_idx").on(table.mediaItemId),
  ],
);

export const mediaComments = pgTable(
  "media_comments",
  {
    id: serial("id").primaryKey(),
    mediaItemId: integer("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("media_comments_media_item_idx").on(table.mediaItemId),
    index("media_comments_user_idx").on(table.userId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  rallyEvents: many(rallyEvents),
  albums: many(albums),
  mediaItems: many(mediaItems),
  uploadBatches: many(uploadBatches),
  favorites: many(favorites),
  comments: many(mediaComments),
}));

export const rallyEventsRelations = relations(rallyEvents, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [rallyEvents.createdById],
    references: [users.id],
  }),
  albums: many(albums),
  mediaItems: many(mediaItems),
  uploadBatches: many(uploadBatches),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  rallyEvent: one(rallyEvents, {
    fields: [albums.rallyEventId],
    references: [rallyEvents.id],
  }),
  createdBy: one(users, {
    fields: [albums.createdById],
    references: [users.id],
  }),
  mediaItems: many(mediaItems),
  uploadBatches: many(uploadBatches),
}));

export const mediaItemsRelations = relations(mediaItems, ({ one, many }) => ({
  album: one(albums, {
    fields: [mediaItems.albumId],
    references: [albums.id],
  }),
  rallyEvent: one(rallyEvents, {
    fields: [mediaItems.rallyEventId],
    references: [rallyEvents.id],
  }),
  createdBy: one(users, {
    fields: [mediaItems.createdById],
    references: [users.id],
  }),
  uploadBatch: one(uploadBatches, {
    fields: [mediaItems.uploadBatchId],
    references: [uploadBatches.id],
  }),
  mediaTags: many(mediaTags),
  favorites: many(favorites),
  comments: many(mediaComments),
}));

export const uploadBatchesRelations = relations(uploadBatches, ({ one, many }) => ({
  rallyEvent: one(rallyEvents, {
    fields: [uploadBatches.rallyEventId],
    references: [rallyEvents.id],
  }),
  album: one(albums, {
    fields: [uploadBatches.albumId],
    references: [albums.id],
  }),
  createdBy: one(users, {
    fields: [uploadBatches.createdById],
    references: [users.id],
  }),
  mediaItems: many(mediaItems),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  mediaTags: many(mediaTags),
}));

export const mediaTagsRelations = relations(mediaTags, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields: [mediaTags.mediaItemId],
    references: [mediaItems.id],
  }),
  tag: one(tags, {
    fields: [mediaTags.tagId],
    references: [tags.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  mediaItem: one(mediaItems, {
    fields: [favorites.mediaItemId],
    references: [mediaItems.id],
  }),
}));

export const mediaCommentsRelations = relations(mediaComments, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields: [mediaComments.mediaItemId],
    references: [mediaItems.id],
  }),
  user: one(users, {
    fields: [mediaComments.userId],
    references: [users.id],
  }),
}));
