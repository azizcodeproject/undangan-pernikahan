import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const CMS_SESSION_COOKIE = "cms_session";
const SESSION_PAYLOAD = "authenticated";

export function getCmsPassword(): string {
  return process.env.CMS_PASSWORD || "change-me";
}

function signSessionPayload(payload: string): string {
  return createHmac("sha256", getCmsPassword()).update(payload).digest("hex");
}

export function createCmsSessionToken(): string {
  return `${SESSION_PAYLOAD}.${signSessionPayload(SESSION_PAYLOAD)}`;
}

export function isValidCmsSessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");
  if (payload !== SESSION_PAYLOAD || !signature) {
    return false;
  }

  const expectedSignature = signSessionPayload(payload);
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (givenBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(givenBuffer, expectedBuffer);
}

export function passwordsMatch(input: string): boolean {
  const expected = Buffer.from(getCmsPassword());
  const given = Buffer.from(input);
  if (expected.length !== given.length) {
    return false;
  }
  return timingSafeEqual(expected, given);
}

export async function isCmsAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidCmsSessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value);
}

export async function requireCmsAuth(): Promise<boolean> {
  return isCmsAuthenticated();
}

export function cmsUnauthorizedResponse(): Response {
  return Response.json(
    { error: "Tidak diizinkan. Silakan masuk ke halaman CMS." },
    { status: 401 },
  );
}
