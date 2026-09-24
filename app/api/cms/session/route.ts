import { requireCmsAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await requireCmsAuth();
  return Response.json({ authenticated });
}
