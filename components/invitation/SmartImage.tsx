"use client";

import { useState } from "react";

type SmartImageProps = {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
};

export function SmartImage({
  src,
  alt,
  fallbackSrc = "/images/photo-fallback.svg",
  className,
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
