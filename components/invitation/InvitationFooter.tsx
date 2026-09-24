import { coupleDisplayName } from "@/lib/format";
import type { WeddingContent } from "@/lib/types";

type InvitationFooterProps = {
  wedding: WeddingContent;
};

export function InvitationFooter({ wedding }: InvitationFooterProps) {
  return (
    <footer className="px-5 py-16 text-center">
      <span className="mx-auto block h-px w-16 bg-line" />
      <p className="mt-5 font-serif text-3xl text-sapphire-deep">
        {coupleDisplayName(wedding.groom.name, wedding.bride.name)}
      </p>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
        {wedding.closingLine}
      </p>
      <p className="mt-8 text-xs tracking-[0.18em] text-muted uppercase">
        Terima kasih sudah datang
      </p>
    </footer>
  );
}
