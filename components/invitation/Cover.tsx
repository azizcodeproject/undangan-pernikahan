"use client";

import { KhatamOrnament } from "@/components/invitation/Ornament";
import { SmartImage } from "@/components/invitation/SmartImage";
import { coupleDisplayName, formatWeddingDate } from "@/lib/format";
import type { WeddingContent } from "@/lib/types";

type CoverProps = {
  wedding: WeddingContent;
  guestName: string;
  isOpen: boolean;
  onOpen: () => void;
};

export function Cover({ wedding, guestName, isOpen, onOpen }: CoverProps) {
  const coupleNames = coupleDisplayName(wedding.bride.name, wedding.groom.name);

  return (
    <section
      className={`cover-panel fixed inset-0 z-50 overflow-hidden ${isOpen ? "is-open" : ""}`}
      aria-hidden={isOpen}
    >
      <SmartImage
        src={wedding.coverImage}
        alt={`Foto sampul ${coupleNames}`}
        fallbackSrc="/images/cover-fallback.svg"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="cover-overlay absolute inset-0" />
      <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10 mix-blend-soft-light" />

      <div className="relative flex h-full flex-col items-center justify-between px-6 py-10 text-center text-white">
        <div className="flex flex-col items-center gap-3 pt-4">
          <KhatamOrnament className="size-11 text-white/80" />
          <p className="text-[0.68rem] tracking-[0.34em] uppercase opacity-80">
            {wedding.tagline}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <p className="font-arabic text-xl text-white/95">
            بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
          <h1 className="cover-title mt-5 font-serif text-5xl leading-tight sm:text-6xl">
            {wedding.bride.name}
            <span className="mx-3 font-serif text-3xl font-normal italic opacity-80">
              &
            </span>
            {wedding.groom.name}
          </h1>
          <p className="mt-5 text-sm tracking-[0.18em] text-white/80 uppercase">
            {formatWeddingDate(wedding.weddingDate)}
          </p>
          {guestName ? (
            <div className="mt-6 max-w-xs rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur-sm">
              <p className="text-[0.7rem] tracking-[0.2em] text-white/70 uppercase">
                Kepada Yth.
              </p>
              <p className="mt-1 font-serif text-lg">{guestName}</p>
            </div>
          ) : null}
        </div>

        <div className="flex w-full max-w-xs flex-col items-center gap-3 pb-2">
          <button
            type="button"
            onClick={onOpen}
            className="cta-pulse inline-flex w-full items-center justify-center rounded-full bg-jade px-6 py-3.5 text-sm font-semibold tracking-wide text-white transition hover:bg-jade-deep"
          >
            Buka Undangan
          </button>
          <p className="text-xs text-white/70">
            Ketuk untuk membuka undangan dan musik
          </p>
        </div>
      </div>
    </section>
  );
}
