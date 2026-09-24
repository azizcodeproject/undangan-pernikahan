import { revalidatePath } from "next/cache";
import { requireCmsAuth, cmsUnauthorizedResponse } from "@/lib/auth";
import { storageFailureResponse } from "@/lib/http-error";
import { appendRsvp, deleteRsvp, readRsvps } from "@/lib/store";
import type { AttendanceStatus, RsvpEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedAttendance = new Set<AttendanceStatus>(["yes", "no", "maybe"]);

export async function GET() {
  if (!(await requireCmsAuth())) {
    return cmsUnauthorizedResponse();
  }

  const entries = await readRsvps();
  return Response.json({ entries });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | Partial<RsvpEntry>
    | null;

  const name = body?.name?.trim() || "";
  const attendance = body?.attendance;
  const message = body?.message?.trim() || "";
  const guestCount = Number(body?.guestCount ?? 0);

  if (name.length < 2) {
    return Response.json({ error: "Nama perlu diisi." }, { status: 400 });
  }

  if (!attendance || !allowedAttendance.has(attendance)) {
    return Response.json(
      { error: "Pilihan kehadiran belum lengkap." },
      { status: 400 },
    );
  }

  if (
    attendance !== "no" &&
    (!Number.isFinite(guestCount) || guestCount < 1 || guestCount > 20)
  ) {
    return Response.json(
      { error: "Jumlah tamu perlu diisi dengan wajar." },
      { status: 400 },
    );
  }

  const entry: RsvpEntry = {
    id: crypto.randomUUID(),
    name,
    attendance,
    guestCount: attendance === "no" ? 0 : Math.round(guestCount),
    message,
    createdAt: new Date().toISOString(),
  };

  try {
    await appendRsvp(entry);
    revalidateInvitation();
    return Response.json({ entry });
  } catch (error) {
    return storageFailureResponse(error);
  }
}

export async function DELETE(request: Request) {
  if (!(await requireCmsAuth())) {
    return cmsUnauthorizedResponse();
  }

  const id = await readDeleteId(request);
  if (!id) {
    return Response.json({ error: "ID RSVP perlu diisi." }, { status: 400 });
  }

  try {
    const removed = await deleteRsvp(id);
    if (!removed) {
      return Response.json({ error: "RSVP tidak ditemukan." }, { status: 404 });
    }

    revalidateInvitation();
    return Response.json({ entry: removed });
  } catch (error) {
    return storageFailureResponse(error);
  }
}

async function readDeleteId(request: Request): Promise<string> {
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const fromBody = body?.id?.trim() || "";
  if (fromBody) {
    return fromBody;
  }

  return new URL(request.url).searchParams.get("id")?.trim() || "";
}

function revalidateInvitation() {
  revalidatePath("/");
  revalidatePath("/admin");
}
