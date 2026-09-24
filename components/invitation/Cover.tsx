"use client";

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
  const coupleNames = coupleDisplayName(wedding.groom.name, wedding.bride.name);

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

      <div className="relative flex h-full flex-col items-center justify-between px-6 py-10 text-center text-white">
        <p className="pt-6 text-[0.68rem] tracking-[0.34em] uppercase opacity-80">
          {wedding.tagline}
        </p>

        <div className="flex flex-col items-center">
          <h1 className="cover-title font-serif text-5xl leading-tight sm:text-6xl">
            {wedding.groom.name}
            <span className="mx-3 font-serif text-3xl font-normal italic opacity-80">
              &
            </span>
            {wedding.bride.name}
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
