import { KhatamOrnament } from "@/components/invitation/Ornament";
import { coupleDisplayName } from "@/lib/format";
import type { WeddingContent } from "@/lib/types";

type InvitationFooterProps = {
  wedding: WeddingContent;
};

export function InvitationFooter({ wedding }: InvitationFooterProps) {
  return (
    <footer className="px-5 py-16 text-center">
      <KhatamOrnament className="mx-auto size-10 text-jade" />
      <p className="mt-5 font-serif text-3xl text-sapphire-deep">
        {coupleDisplayName(wedding.bride.name, wedding.groom.name)}
      </p>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
        {wedding.closingLine}
      </p>
      <p className="mt-8 text-xs tracking-[0.18em] text-muted uppercase">
        Mohon doa restu
      </p>
    </footer>
  );
}
