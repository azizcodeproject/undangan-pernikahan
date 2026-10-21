import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const errorMessage =
    error === "weak-password"
      ? "Kata sandi minimal 8 karakter."
      : error
        ? "Pendaftaran gagal. Coba lagi."
        : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-serif text-3xl">Daftar</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Buat akun untuk mulai menyusun undangan.
      </p>

      {errorMessage ? (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <form action={signUpAction} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-700">Nama</span>
          <input
            name="name"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-neutral-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-neutral-700">Kata sandi</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Daftar
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-600">
        Sudah punya akun?{" "}
        <Link href="/auth/sign-in" className="underline">
          Masuk
        </Link>
      </p>
    </main>
  );
}
