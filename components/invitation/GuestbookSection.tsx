"use client";

import { FormEvent, useState } from "react";
import { Reveal } from "@/components/invitation/Reveal";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import type { GuestbookMessage } from "@/lib/types";

type GuestbookSectionProps = {
  initialMessages: GuestbookMessage[];
};

export function GuestbookSection({ initialMessages }: GuestbookSectionProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusText("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: GuestbookMessage;
      };

      if (!response.ok || !payload.message) {
        setStatusText(payload.error || "Pesan belum tersimpan. Coba lagi ya.");
        return;
      }

      setMessages((current) => [payload.message as GuestbookMessage, ...current]);
      setName("");
      setMessage("");
      setStatusText("Pesan Anda sudah kami baca. Terima kasih.");
    } catch {
      setStatusText("Jaringan sedang tersendat. Mohon coba beberapa saat lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="pesan" className="px-5 py-16 sm:py-20">
      <SectionHeading
        eyebrow="Buku Tamu"
        title="Pesan untuk Pengantin"
        description="Tulis doa atau ucapan. Kami akan membacanya pelan-pelan."
      />
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-3xl border border-line bg-card p-6 shadow-sm"
          >
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink">Nama</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-jade"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink">Pesan</span>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-jade"
                placeholder="Doa dan ucapan untuk Yusuf & Sintia"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-jade px-5 py-3 text-sm font-semibold text-white transition hover:bg-jade-deep disabled:opacity-60"
            >
              {isSubmitting ? "Mengirim..." : "Kirim pesan"}
            </button>
            {statusText ? (
              <p className="text-sm text-jade-deep">{statusText}</p>
            ) : null}
          </form>
        </Reveal>

        <div className="flex flex-col gap-3">
          {messages.slice(0, 8).map((entry) => (
            <Reveal key={entry.id}>
              <article className="rounded-3xl border border-line bg-card px-5 py-4">
                <p className="font-serif text-lg text-sapphire-deep">{entry.name}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{entry.message}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
