import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { publishInvitationAction } from "@/app/actions/invitations";
import { auth } from "@/lib/auth/server";
import { coupleDisplayName } from "@/lib/format";
import { ForbiddenError, getById } from "@/lib/repos/invitations";

export const dynamic = "force-dynamic";

export default async function InvitationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  let invitation;
  try {
    invitation = await getById(id, session.user.id);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      notFound();
    }
    notFound();
  }

  const { content } = invitation;
  const couple = coupleDisplayName(content.groom.name, content.bride.name);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/dashboard" className="text-sm underline">
        ← Kembali
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{couple || "Undangan baru"}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            /{invitation.slug} · {invitation.status} · versi{" "}
            {invitation.publishedVersion}
          </p>
        </div>

        <form action={publishInvitationAction}>
          <input type="hidden" name="id" value={invitation.id} />
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Terbitkan
          </button>
        </form>
      </header>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 p-4">
          <dt className="text-xs uppercase tracking-wide text-neutral-500">
            Mempelai pria
          </dt>
          <dd className="mt-1">{content.groom.name || "—"}</dd>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <dt className="text-xs uppercase tracking-wide text-neutral-500">
            Mempelai wanita
          </dt>
          <dd className="mt-1">{content.bride.name || "—"}</dd>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <dt className="text-xs uppercase tracking-wide text-neutral-500">
            Acara
          </dt>
          <dd className="mt-1">{content.events.length} acara</dd>
        </div>
        <div className="rounded-xl border border-neutral-200 p-4">
          <dt className="text-xs uppercase tracking-wide text-neutral-500">
            Terakhir diperbarui
          </dt>
          <dd className="mt-1">
            {invitation.updatedAt.toLocaleString("id-ID")}
          </dd>
        </div>
      </dl>
    </main>
  );
}
