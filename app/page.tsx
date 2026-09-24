import type { Metadata } from "next";
import { InvitationApp } from "@/components/invitation/InvitationApp";
import { coupleDisplayName } from "@/lib/format";
import { readGallery, readMessages, readWedding } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const wedding = await readWedding();
  return {
    title: `${coupleDisplayName(wedding.bride.name, wedding.groom.name)} — Undangan Pernikahan`,
    description: wedding.openingLine,
  };
}

export default async function HomePage() {
  const [wedding, gallery, messages] = await Promise.all([
    readWedding(),
    readGallery(),
    readMessages(),
  ]);

  const approvedMessages = messages
    .filter((message) => message.approved)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return (
    <InvitationApp
      wedding={wedding}
      gallery={gallery}
      messages={approvedMessages}
    />
  );
}
