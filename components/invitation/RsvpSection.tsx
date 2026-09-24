"use client";

import { FormEvent, useState } from "react";
import { Reveal } from "@/components/invitation/Reveal";
import { SectionHeading } from "@/components/invitation/SectionHeading";
import type { AttendanceStatus } from "@/lib/types";

const attendanceOptions: { value: AttendanceStatus; label: string }[] = [
  { value: "yes", label: "Akan hadir" },
  { value: "maybe", label: "Belum bisa pastikan" },
  { value: "no", label: "Mohon maaf, berhalangan" },
];

export function RsvpSection() {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState<AttendanceStatus>("yes");
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusText("");

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          attendance,
          guestCount: attendance === "no" ? 0 : guestCount,
          message: message.trim(),
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatusText(payload.error || "Konfirmasi belum tersimpan. Coba lagi ya.");
        return;
      }

      setStatusText("Terima kasih, konfirmasinya sudah kami terima.");
      setName("");
      setMessage("");
      setGuestCount(1);
      setAttendance("yes");
    } catch {
      setStatusText("Jaringan sedang tersendat. Mohon coba beberapa saat lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="rsvp" className="px-5 py-16 sm:py-20">
      <SectionHeading
        eyebrow="Kehadiran"
        title="Konfirmasi Kehadiran"
        description="Bantu kami menyiapkan tempat duduk dan hidangan dengan konfirmasi yang hangat."
      />
      <Reveal>
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-xl flex-col gap-4 rounded-3xl border border-line bg-card p-6 shadow-sm"
        >
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-ink">Nama</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-jade"
              placeholder="Nama lengkap atau keluarga"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-ink">Kehadiran</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {attendanceOptions.map((option) => (
                <label
                  key={option.value}
                  className={`rounded-2xl border px-3 py-3 text-center text-sm ${
                    attendance === option.value
                      ? "border-jade bg-jade/10 text-jade-deep"
                      : "border-line bg-cream text-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="attendance"
                    value={option.value}
                    checked={attendance === option.value}
                    onChange={() => setAttendance(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {attendance !== "no" ? (
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink">Jumlah tamu</span>
              <input
                type="number"
                min={1}
                max={12}
                value={guestCount}
                onChange={(event) => setGuestCount(Number(event.target.value))}
                className="rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-jade"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-ink">Pesan (opsional)</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              className="rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-jade"
              placeholder="Ucapan singkat untuk kami"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-sapphire px-5 py-3 text-sm font-semibold text-white transition hover:bg-sapphire-deep disabled:opacity-60"
          >
            {isSubmitting ? "Menyimpan..." : "Kirim konfirmasi"}
          </button>
          {statusText ? (
            <p className="text-center text-sm text-jade-deep">{statusText}</p>
          ) : null}
        </form>
      </Reveal>
    </section>
  );
}
