import { cookies } from "next/headers";
import { CMS_SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(CMS_SESSION_COOKIE);
  return Response.json({ ok: true });
}
