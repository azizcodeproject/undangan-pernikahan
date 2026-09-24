import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="paper-bg flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.22em] text-jade uppercase">Halaman tidak ditemukan</p>
      <h1 className="mt-3 font-serif text-3xl text-sapphire-deep">
        Sepertinya undangan ini belum sampai ke sini
      </h1>
      <Link
        href="/"
        className="mt-6 rounded-full bg-jade px-5 py-3 text-sm font-semibold text-white"
      >
        Kembali ke undangan
      </Link>
    </main>
  );
}
