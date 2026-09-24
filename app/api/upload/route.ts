import { cmsUnauthorizedResponse, requireCmsAuth } from "@/lib/auth";
import { writePublicAsset } from "@/lib/data-store";
import { storageFailureResponse } from "@/lib/http-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const maxBytes = 4 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await requireCmsAuth())) {
    return cmsUnauthorizedResponse();
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Berkas foto belum dipilih." }, { status: 400 });
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    return Response.json(
      { error: "Gunakan foto JPG, PNG, WEBP, atau GIF." },
      { status: 400 },
    );
  }

  if (file.size > maxBytes) {
    return Response.json(
      { error: "Ukuran foto maksimal 4 MB." },
      { status: 400 },
    );
  }

  const fileName = `${Date.now()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const src = await writePublicAsset(fileName, buffer, file.type);
    return Response.json({ src });
  } catch (error) {
    return storageFailureResponse(error);
  }
}
