import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { WeddingContent } from "../types";

export const invitationStatus = pgEnum("invitation_status", [
  "draft",
  "published",
  "archived",
]);

export const attendanceStatus = pgEnum("attendance_status", [
  "yes",
  "no",
  "maybe",
]);

export const mediaKind = pgEnum("media_kind", [
  "cover",
  "couple",
  "gallery",
  "music",
  "other",
]);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // ID user dari Neon Auth (schema neon_auth). Sengaja text, bukan FK,
    // agar database tetap bisa dipakai tanpa service Auth.
    ownerId: text("owner_id").notNull(),
    slug: text("slug").notNull(),
    templateId: text("template_id").notNull().default("elegant"),
    status: invitationStatus("status").notNull().default("draft"),
    content: jsonb("content").$type<WeddingContent>().notNull(),
    theme: jsonb("theme").$type<Record<string, unknown>>().notNull().default({}),
    publishedContent: jsonb("published_content").$type<WeddingContent>(),
    publishedTheme: jsonb("published_theme").$type<Record<string, unknown>>(),
    publishedVersion: integer("published_version").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("invitations_slug_key").on(table.slug),
    index("invitations_owner_idx").on(table.ownerId),
    index("invitations_status_idx").on(table.status, table.expiresAt),
  ],
);

export const invitationVersions = pgTable(
  "invitation_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").$type<WeddingContent>().notNull(),
    theme: jsonb("theme").$type<Record<string, unknown>>().notNull().default({}),
    label: text("label"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("invitation_versions_unique").on(
      table.invitationId,
      table.version,
    ),
  ],
);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    kind: mediaKind("kind").notNull().default("gallery"),
    objectKey: text("object_key").notNull(),
    url: text("url"),
    mime: text("mime"),
    bytes: integer("bytes"),
    width: integer("width"),
    height: integer("height"),
    caption: text("caption").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("media_invitation_idx").on(table.invitationId, table.sortOrder)],
);

export const guests = pgTable(
  "guests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phoneE164: text("phone_e164"),
    groupLabel: text("group_label").notNull().default(""),
    token: text("token").notNull(),
    rsvpStatus: attendanceStatus("rsvp_status").notNull().default("maybe"),
    optOutAt: timestamp("opt_out_at", { withTimezone: true }),
    linkOpenedAt: timestamp("link_opened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("guests_token_key").on(table.token),
    uniqueIndex("guests_invitation_phone_key").on(
      table.invitationId,
      table.phoneE164,
    ),
    index("guests_invitation_idx").on(table.invitationId),
  ],
);

export const rsvpEntries = pgTable(
  "rsvp_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").references(() => guests.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    attendance: attendanceStatus("attendance").notNull(),
    guestCount: integer("guest_count").notNull().default(1),
    message: text("message").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("rsvp_invitation_idx").on(table.invitationId, table.createdAt)],
);

export const guestbookMessages = pgTable(
  "guestbook_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").references(() => guests.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    message: text("message").notNull(),
    approved: boolean("approved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("guestbook_invitation_idx").on(
      table.invitationId,
      table.approved,
      table.createdAt,
    ),
  ],
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type MediaItem = typeof media.$inferSelect;
