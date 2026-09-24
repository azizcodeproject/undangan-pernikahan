"use client";

import { useEffect } from "react";
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

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowRight") {
        onChange((activeIndex + 1) % items.length);
      }
      if (event.key === "ArrowLeft") {
        onChange((activeIndex - 1 + items.length) % items.length);
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
        <SmartImage
          src={activeItem.src}
          alt={activeItem.caption}
          className="max-h-[78vh] w-full rounded-2xl object-contain"
        />
        <p className="mt-3 text-center text-sm text-white/85">
          {activeItem.caption}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white"
            onClick={() => onChange((activeIndex - 1 + items.length) % items.length)}
          >
            Sebelumnya
          </button>
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-sm text-sapphire-deep"
            onClick={onClose}
          >
            Tutup
          </button>
          <button
            type="button"
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white"
            onClick={() => onChange((activeIndex + 1) % items.length)}
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
