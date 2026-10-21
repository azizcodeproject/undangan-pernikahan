"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { sampleWeddingContent } from "@/lib/invitations/sample";
import { createDraft, publish } from "@/lib/repos/invitations";

export async function createSampleInvitationAction() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const suffix = crypto.randomUUID().slice(0, 8);
  await createDraft({
    ownerId: session.user.id,
    slug: `contoh-${suffix}`,
    content: sampleWeddingContent(),
  });

  revalidatePath("/dashboard");
}

export async function publishInvitationAction(formData: FormData) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const id = String(formData.get("id") ?? "");
  await publish(id, session.user.id);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${id}`);
}
