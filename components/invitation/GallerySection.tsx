"use client";

import { useState } from "react";
import { Lightbox } from "@/components/invitation/Lightbox";
import { Reveal } from "@/components/invitation/Reveal";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import { SmartImage } from "@/components/invitation/SmartImage";
import type { GalleryItem } from "@/lib/types";

type GallerySectionProps = {
  items: GalleryItem[];
};

export function GallerySection({ items }: GallerySectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="momen" className="px-5 py-16 sm:py-20">
      <SectionHeading
        eyebrow="Galeri"
        title="Momen Bersama"
        description="Beberapa potret yang kami simpan. Silakan ketuk untuk melihat lebih dekat."
      />
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.id}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group relative block overflow-hidden rounded-2xl"
            >
              <SmartImage
                src={item.src}
                alt={item.caption}
                className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sapphire-deep/70 to-transparent px-3 py-3 text-left text-xs text-white opacity-0 transition group-hover:opacity-100">
                {item.caption}
              </span>
            </button>
          </Reveal>
        ))}
      </div>
      <Lightbox
        items={items}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onChange={setActiveIndex}
      />
    </section>
  );
}
