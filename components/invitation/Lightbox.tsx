"use client";

import { useEffect, type ReactNode } from "react";
import { SmartImage } from "@/components/invitation/SmartImage";
import type { GalleryItem } from "@/lib/types";

type LightboxProps = {
  items: GalleryItem[];
  activeIndex: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
};

export function Lightbox({
  items,
  activeIndex,
  onClose,
  onChange,
}: LightboxProps) {
  const activeItem = activeIndex === null ? null : items[activeIndex];

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const currentIndex = activeIndex;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowRight") {
        onChange((currentIndex + 1) % items.length);
      }
      if (event.key === "ArrowLeft") {
        onChange((currentIndex - 1 + items.length) % items.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, items.length, onChange, onClose]);

  if (activeItem == null || activeIndex === null) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-sapphire-deep/80 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau foto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Tutup pratinjau"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/95 text-sapphire-deep shadow-lg transition hover:bg-white"
        >
          <CloseIcon />
        </button>

        <SmartImage
          key={activeItem.id}
          src={activeItem.src}
          alt={activeItem.caption}
          className="max-h-[78vh] w-full rounded-2xl object-contain"
        />
        <p className="mt-3 text-center text-sm text-white/85">
          {activeItem.caption}
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <LightboxIconButton
            label="Foto sebelumnya"
            onClick={() =>
              onChange((activeIndex - 1 + items.length) % items.length)
            }
          >
            <ChevronLeftIcon />
          </LightboxIconButton>
          <p className="min-w-14 text-center text-xs tracking-[0.18em] text-white/70">
            {activeIndex + 1} / {items.length}
          </p>
          <LightboxIconButton
            label="Foto berikutnya"
            onClick={() => onChange((activeIndex + 1) % items.length)}
          >
            <ChevronRightIcon />
          </LightboxIconButton>
        </div>
      </div>
    </div>
  );
}

function LightboxIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
    >
      {children}
    </button>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-[2]" aria-hidden>
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-[2]" aria-hidden>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-[2.2]" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
