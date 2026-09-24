type OrnamentProps = {
  className?: string;
};

export function KhatamOrnament({ className = "size-10" }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <rect
        x="22"
        y="22"
        width="36"
        height="36"
        strokeWidth="1.15"
        opacity="0.9"
      />
      <rect
        x="22"
        y="22"
        width="36"
        height="36"
        transform="rotate(45 40 40)"
        strokeWidth="1.15"
      />
      <circle cx="40" cy="40" r="27" strokeWidth="0.55" opacity="0.45" />
    </svg>
  );
}

export function SectionDivider() {
  return (
    <div
      className="flex items-center justify-center gap-4 text-jade"
      aria-hidden
    >
      <span className="h-px w-12 bg-line sm:w-16" />
      <KhatamOrnament className="size-8" />
      <span className="h-px w-12 bg-line sm:w-16" />
    </div>
  );
}
