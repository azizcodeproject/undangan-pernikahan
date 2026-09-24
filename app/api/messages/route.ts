import { revalidatePath } from "next/cache";
import { requireCmsAuth } from "@/lib/auth";
import { storageFailureResponse } from "@/lib/http-error";
import { appendMessage, readMessages } from "@/lib/store";
import type { GuestbookMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const messages = await readMessages();
  const isAdmin = await requireCmsAuth();
  const visible = isAdmin
    ? messages
    : messages.filter((message) => message.approved);

  return Response.json({
    messages: [...visible].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    ),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | Partial<GuestbookMessage>
    | null;

  const name = body?.name?.trim() || "";
  const message = body?.message?.trim() || "";

  if (name.length < 2) {
    return Response.json({ error: "Nama perlu diisi." }, { status: 400 });
  }

  if (message.length < 4) {
    return Response.json(
      { error: "Pesan masih terlalu singkat." },
      { status: 400 },
    );
  }

  const entry: GuestbookMessage = {
    id: crypto.randomUUID(),
    name,
    message,
    approved: true,
    createdAt: new Date().toISOString(),
  };

  try {
    await appendMessage(entry);
    revalidatePath("/");
    revalidatePath("/admin");
    return Response.json({ message: entry });
  } catch (error) {
    return storageFailureResponse(error);
  }
}
