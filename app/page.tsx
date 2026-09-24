import type { Metadata } from "next";
import { InvitationApp } from "@/components/invitation/InvitationApp";
import { coupleDisplayName } from "@/lib/format";
import { readGallery, readMessages, readWedding } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const wedding = await readWedding();
  return {
    title: `${coupleDisplayName(wedding.groom.name, wedding.bride.name)} — Undangan Pernikahan`,
    description: wedding.openingLine,
  };
}

type HomePageProps = {
  searchParams: Promise<{ to?: string | string[] }>;
};

function readGuestName(value: string | string[] | undefined): string {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue?.trim() || "";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
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
      guestName={readGuestName(params.to)}
    />
  );
}
