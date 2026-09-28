"use client";

import { useState } from "react";
import { Reveal } from "@/components/invitation/Reveal";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import type { GiftAccount, WeddingGift } from "@/lib/types";

type GiftSectionProps = {
  gift: WeddingGift | undefined;
};

export function GiftSection({ gift }: GiftSectionProps) {
  const accounts = gift?.accounts?.filter(
    (account) => account.bankName.trim() && account.accountNumber.trim(),
  );

  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    <section id="hadiah" className="relative overflow-hidden px-5 py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--jade)_8%,transparent),transparent_55%)]"
      />
      <div className="relative">
        <SectionHeading
          eyebrow="Tanda kasih"
          title="Kirim Hadiah"
          description={
            gift?.note?.trim() ||
            "Doa restu Anda sudah lebih dari cukup. Jika berkenan, berikut rekening yang bisa digunakan."
          }
        />
        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
          {accounts.map((account, index) => (
            <Reveal key={account.id}>
              <GiftAccountCard account={account} accent={index % 2 === 0 ? "jade" : "sapphire"} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\s+/g, "");
  if (digits.length <= 4) {
    return digits;
  }
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function GiftAccountCard({
  account,
  accent,
}: {
  account: GiftAccount;
  accent: "jade" | "sapphire";
}) {
  const [isCopied, setIsCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const isJade = accent === "jade";

  async function copyAccountNumber() {
    try {
      await navigator.clipboard.writeText(account.accountNumber.replace(/\s+/g, ""));
      setIsCopied(true);
      setCopyStatus("Nomor rekening sudah disalin.");
      window.setTimeout(() => {
        setIsCopied(false);
        setCopyStatus("");
      }, 2200);
    } catch {
      setIsCopied(false);
      setCopyStatus("Salin belum berhasil. Coba salin manual ya.");
    }
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-card shadow-[0_18px_40px_-28px_rgba(23,37,84,0.45)] transition duration-500 hover:-translate-y-1 ${
        isJade ? "border-jade/20" : "border-sapphire/20"
      }`}
    >
      <div
        className={`relative px-6 pt-6 pb-5 ${
          isJade
            ? "bg-gradient-to-br from-jade to-jade-deep"
            : "bg-gradient-to-br from-sapphire to-sapphire-deep"
        }`}
      >
        <div
          aria-hidden
          className="absolute -top-8 -right-6 size-28 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-10 left-8 size-24 rounded-full bg-white/5"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold tracking-[0.28em] text-white/75 uppercase">
              Transfer bank
            </p>
            <p className="mt-2 font-serif text-3xl text-white">{account.bankName}</p>
          </div>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.65rem] tracking-[0.16em] text-white/90 uppercase backdrop-blur-sm">
            Hadiah
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">Atas nama</p>
        <p className="mt-1 font-serif text-2xl text-sapphire-deep">
          {account.accountName}
        </p>

        <div
          className={`mt-5 rounded-2xl border px-4 py-4 ${
            isJade
              ? "border-jade/15 bg-jade/[0.04]"
              : "border-sapphire/15 bg-sapphire/[0.04]"
          }`}
        >
          <p className="text-xs tracking-[0.18em] text-muted uppercase">
            Nomor rekening
          </p>
          <p className="mt-2 font-mono text-[1.15rem] tracking-[0.12em] text-ink sm:text-xl">
            {formatAccountNumber(account.accountNumber)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void copyAccountNumber()}
          className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition ${
            isCopied
              ? "bg-jade-deep"
              : isJade
                ? "bg-jade hover:bg-jade-deep"
                : "bg-sapphire hover:bg-sapphire-deep"
          }`}
        >
          <CopyGlyph copied={isCopied} />
          {isCopied ? "Tersalin" : "Salin nomor rekening"}
        </button>
        {copyStatus ? (
          <p className="mt-3 text-center text-sm text-jade-deep">{copyStatus}</p>
        ) : null}
      </div>
    </article>
  );
}

function CopyGlyph({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-[2]" aria-hidden>
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V7a2 2 0 0 1 2-2h8" strokeLinecap="round" />
    </svg>
  );
}
