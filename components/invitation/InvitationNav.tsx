const navItems = [
  { href: "#ayat", label: "Ayat" },
  { href: "#acara", label: "Acara" },
  { href: "#cerita", label: "Cerita" },
  { href: "#momen", label: "Momen" },
  { href: "#rsvp", label: "RSVP" },
  { href: "#pesan", label: "Pesan" },
];

type InvitationNavProps = {
  coupleNames: string;
};

export function InvitationNav({ coupleNames }: InvitationNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <a href="#membuka" className="font-serif text-lg text-sapphire-deep">
          {coupleNames}
        </a>
        <nav className="flex max-w-[60%] gap-1 overflow-x-auto text-sm">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-muted transition hover:bg-sand hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
