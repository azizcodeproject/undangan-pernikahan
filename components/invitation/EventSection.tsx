"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/invitation/Reveal";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import type { WeddingContent } from "@/lib/types";

type EventSectionProps = {
  wedding: WeddingContent;
};

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function EventSection({ wedding }: EventSectionProps) {
  const countdown = useCountdown(wedding.weddingDate);

  return (
    <section id="acara" className="px-5 py-16 sm:py-20">
      <SectionHeading
        eyebrow="InsyaAllah"
        title="Detail Acara"
        description="Kami menantikan kehadiran Anda di dua momen yang kami jaga dengan khidmat."
      />

      {countdown ? (
        <Reveal>
          <div className="mx-auto mb-8 grid max-w-lg grid-cols-4 gap-2 sm:gap-3">
            <CountdownCell label="Hari" value={countdown.days} />
            <CountdownCell label="Jam" value={countdown.hours} />
            <CountdownCell label="Menit" value={countdown.minutes} />
            <CountdownCell label="Detik" value={countdown.seconds} />
          </div>
        </Reveal>
      ) : null}

      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        {wedding.events.map((event) => (
          <Reveal key={event.id}>
            <article className="flex h-full flex-col rounded-3xl border border-line bg-card p-6 shadow-sm">
              <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-jade uppercase">
                {event.title}
              </p>
              <h3 className="mt-3 font-serif text-2xl text-sapphire-deep">
                {event.venue}
              </h3>
              <p className="mt-3 text-sm text-ink">{event.dateLabel}</p>
              <p className="text-sm text-ink">{event.timeLabel}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{event.address}</p>
              <a
                href={event.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-full border border-sapphire/20 px-4 py-2.5 text-sm font-medium text-sapphire transition hover:bg-sapphire hover:text-white"
              >
                Lihat peta
              </a>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CountdownCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-2 py-3 text-center">
      <p className="font-serif text-2xl text-sapphire-deep sm:text-3xl">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[0.65rem] tracking-[0.16em] text-muted uppercase">
        {label}
      </p>
    </div>
  );
}

function useCountdown(isoDate: string): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    function tick() {
      const target = new Date(isoDate).getTime();
      if (Number.isNaN(target)) {
        setParts(null);
        return;
      }

      const remaining = Math.max(0, target - Date.now());
      setParts({
        days: Math.floor(remaining / 86_400_000),
        hours: Math.floor((remaining % 86_400_000) / 3_600_000),
        minutes: Math.floor((remaining % 3_600_000) / 60_000),
        seconds: Math.floor((remaining % 60_000) / 1000),
      });
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [isoDate]);

  return parts;
}
