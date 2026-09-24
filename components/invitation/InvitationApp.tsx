"use client";

import { useEffect, useState } from "react";
import { Cover } from "@/components/invitation/Cover";
import { CoupleIntro } from "@/components/invitation/CoupleIntro";
import { EventSection } from "@/components/invitation/EventSection";
import { GallerySection } from "@/components/invitation/GallerySection";
import { GuestbookSection } from "@/components/invitation/GuestbookSection";
import { InvitationFooter } from "@/components/invitation/InvitationFooter";
import { InvitationNav } from "@/components/invitation/InvitationNav";
import { MusicControl } from "@/components/invitation/MusicControl";
import { QuranSection } from "@/components/invitation/QuranSection";
import { RsvpSection } from "@/components/invitation/RsvpSection";
import { StorySection } from "@/components/invitation/StorySection";
import { coupleDisplayName } from "@/lib/format";
import type { GalleryItem, GuestbookMessage, WeddingContent } from "@/lib/types";

type InvitationAppProps = {
  wedding: WeddingContent;
  gallery: GalleryItem[];
  messages: GuestbookMessage[];
};

export function InvitationApp({
  wedding,
  gallery,
  messages,
}: InvitationAppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const guestName = useGuestName();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function openInvitation() {
    setIsOpen(true);
    setIsPlaying(true);
  }

  return (
    <div className="paper-bg min-h-dvh">
      <Cover
        wedding={wedding}
        guestName={guestName}
        isOpen={isOpen}
        onOpen={openInvitation}
      />
      <MusicControl
        music={wedding.music}
        isPlaying={isPlaying}
        unlocked={isOpen}
        onToggle={() => setIsPlaying((current) => !current)}
      />
      <InvitationNav
        coupleNames={coupleDisplayName(wedding.bride.name, wedding.groom.name)}
      />
      <main>
        <CoupleIntro wedding={wedding} guestName={guestName} />
        <QuranSection ayahs={wedding.quran} />
        <EventSection wedding={wedding} />
        <StorySection chapters={wedding.story} />
        <GallerySection items={gallery} />
        <RsvpSection />
        <GuestbookSection initialMessages={messages} />
      </main>
      <InvitationFooter wedding={wedding} />
    </div>
  );
}

function useGuestName(): string {
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setGuestName(params.get("to")?.trim() || "");
  }, []);

  return guestName;
}
