import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  invitationVersions,
  invitations,
  type Invitation,
} from "@/lib/db/schema";
import type { WeddingContent } from "@/lib/types";

export class ForbiddenError extends Error {
  constructor(message = "Tidak diizinkan mengakses undangan ini.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "login",
  "preview",
  "register",
  "robots",
  "sitemap",
]);

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

export async function listByOwner(ownerId: string): Promise<Invitation[]> {
  return getDb()
    .select()
    .from(invitations)
    .where(eq(invitations.ownerId, ownerId))
    .orderBy(desc(invitations.updatedAt));
}

export async function getById(
  id: string,
  actorUserId: string,
): Promise<Invitation> {
  const [row] = await getDb()
    .select()
    .from(invitations)
    .where(eq(invitations.id, id))
    .limit(1);

  if (!row) {
    throw new Error("Undangan tidak ditemukan.");
  }
  if (row.ownerId !== actorUserId) {
    throw new ForbiddenError();
  }
  return row;
}

export async function getPublishedBySlug(
  slug: string,
): Promise<Invitation | null> {
  const [row] = await getDb()
    .select()
    .from(invitations)
    .where(and(eq(invitations.slug, slug), eq(invitations.status, "published")))
    .limit(1);

  return row ?? null;
}

export type CreateDraftInput = {
  ownerId: string;
  slug: string;
  content: WeddingContent;
  templateId?: string;
  theme?: Record<string, unknown>;
};

export async function createDraft(input: CreateDraftInput): Promise<Invitation> {
  if (!isValidSlug(input.slug)) {
    throw new Error(
      "Slug tidak valid. Gunakan 3–40 karakter: huruf kecil, angka, tanda hubung.",
    );
  }

  const [row] = await getDb()
    .insert(invitations)
    .values({
      ownerId: input.ownerId,
      slug: input.slug,
      content: input.content,
      templateId: input.templateId ?? "elegant",
      theme: input.theme ?? {},
    })
    .returning();

  return row;
}

export async function updateDraft(
  id: string,
  actorUserId: string,
  patch: { content?: WeddingContent; theme?: Record<string, unknown> },
): Promise<Invitation> {
  await getById(id, actorUserId);

  const [row] = await getDb()
    .update(invitations)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(invitations.id, id))
    .returning();

  return row;
}

export async function publish(
  id: string,
  actorUserId: string,
): Promise<Invitation> {
  const current = await getById(id, actorUserId);
  const nextVersion = current.publishedVersion + 1;

  const [row] = await getDb()
    .update(invitations)
    .set({
      status: "published",
      publishedContent: current.content,
      publishedTheme: current.theme,
      publishedVersion: nextVersion,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(invitations.id, id))
    .returning();

  await getDb().insert(invitationVersions).values({
    invitationId: id,
    version: nextVersion,
    snapshot: current.content,
    theme: current.theme,
    label: `Publish v${nextVersion}`,
    createdBy: actorUserId,
  });

  return row;
}
