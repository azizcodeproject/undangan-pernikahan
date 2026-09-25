type SiteCreditProps = {
  className?: string;
};

export function SiteCredit({ className = "" }: SiteCreditProps) {
  const year = new Date().getFullYear();

  return (
    <p className={`text-center text-xs tracking-[0.12em] text-muted ${className}`}>
      © {year} Ghaura Tech
    </p>
  );
}
