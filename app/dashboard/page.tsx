import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { createSampleInvitationAction } from "@/app/actions/invitations";
import { auth } from "@/lib/auth/server";
import { listByOwner } from "@/lib/repos/invitations";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  published: "Terbit",
  archived: "Arsip",
};

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/auth/sign-in");
  }

  const invitations = await listByOwner(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Undangan saya</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Masuk sebagai {user.email}
          </p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
          >
            Keluar
          </button>
        </form>
      </header>

      <section className="mt-8">
        {invitations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 px-6 py-10 text-center">
            <p className="text-sm text-neutral-600">
              Belum ada undangan. Mulai dari contoh untuk menguji alur.
            </p>
            <form action={createSampleInvitationAction} className="mt-4">
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
              >
                Buat undangan contoh
              </button>
            </form>
          </div>
        ) : (
          <ul className="space-y-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 px-5 py-4"
              >
                <div>
                  <p className="font-medium">/{invitation.slug}</p>
                  <p className="text-xs text-neutral-500">
                    {statusLabel[invitation.status] ?? invitation.status} · v
                    {invitation.publishedVersion}
                  </p>
                </div>
                <Link
                  href={`/dashboard/${invitation.id}`}
                  className="text-sm underline"
                >
                  Kelola
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
