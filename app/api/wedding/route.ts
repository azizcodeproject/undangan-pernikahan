import { revalidatePath } from "next/cache";
import { cmsUnauthorizedResponse, requireCmsAuth } from "@/lib/auth";
import { readWedding, writeWedding } from "@/lib/store";
import type { WeddingContent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const wedding = await readWedding();
  return Response.json({ wedding });
}

export async function PUT(request: Request) {
  if (!(await requireCmsAuth())) {
    return cmsUnauthorizedResponse();
  }

  const body = (await request.json().catch(() => null)) as
    | { wedding?: WeddingContent }
    | null;

  if (!body?.wedding?.bride?.name || !body.wedding.groom?.name) {
    return Response.json(
      { error: "Data pengantin belum lengkap." },
      { status: 400 },
    );
  }

  await writeWedding(body.wedding);
  revalidatePath("/");
  revalidatePath("/admin");
  return Response.json({ wedding: body.wedding });
}
