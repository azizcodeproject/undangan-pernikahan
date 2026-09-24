import { cookies } from "next/headers";
import {
  CMS_SESSION_COOKIE,
  createCmsSessionToken,
  passwordsMatch,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;
  const password = body?.password || "";

  if (!passwordsMatch(password)) {
    return Response.json({ error: "Kata sandi belum tepat." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(CMS_SESSION_COOKIE, createCmsSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ ok: true });
}
