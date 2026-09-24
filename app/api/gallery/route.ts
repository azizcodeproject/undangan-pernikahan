import { revalidatePath } from "next/cache";
import { cmsUnauthorizedResponse, requireCmsAuth } from "@/lib/auth";
import { storageFailureResponse } from "@/lib/http-error";
import { readGallery, writeGallery } from "@/lib/store";
import type { GalleryItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await readGallery();
  return Response.json({ items });
}

export async function POST(request: Request) {
  if (!(await requireCmsAuth())) {
    return cmsUnauthorizedResponse();
  }

  const body = (await request.json().catch(() => null)) as
    | Partial<GalleryItem>
    | null;
  const src = body?.src?.trim() || "";
  const caption = body?.caption?.trim() || "";

  if (!src) {
    return Response.json({ error: "URL foto perlu diisi." }, { status: 400 });
  }

  const items = await readGallery();
  const nextItem: GalleryItem = {
    id: crypto.randomUUID(),
    src,
    caption,
    order: items.length,
  };
  items.push(nextItem);
  try {
    await writeGallery(items);
    revalidateInvitation();
    return Response.json({ item: nextItem, items });
  } catch (error) {
    return storageFailureResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!(await requireCmsAuth())) {
    return cmsUnauthorizedResponse();
  }

  const body = (await request.json().catch(() => null)) as
    | { items?: GalleryItem[] }
    | null;

  if (!Array.isArray(body?.items)) {
    return Response.json(
      { error: "Daftar galeri tidak valid." },
      { status: 400 },
    );
  }

  const sanitized = body.items
    .filter((item) => item.id && item.src)
    .map((item, index) => ({
      id: String(item.id),
      src: String(item.src),
      caption: String(item.caption || ""),
      order: index,
    }));

  try {
    await writeGallery(sanitized);
    revalidateInvitation();
    return Response.json({ items: sanitized });
  } catch (error) {
    return storageFailureResponse(error);
  }
}

function revalidateInvitation() {
  revalidatePath("/");
  revalidatePath("/admin");
}
