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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const visibleSrc = failedSrc === src ? fallbackSrc : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={visibleSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (visibleSrc !== fallbackSrc) {
          setFailedSrc(src);
        }
      }}
    />
  );
}
