"use client";

import { FormEvent, useEffect, useState } from "react";
import { SmartImage } from "@/components/invitation/SmartImage";
import { formatDateTime } from "@/lib/format";
import type {
  GalleryItem,
  GuestbookMessage,
  RsvpEntry,
  WeddingContent,
} from "@/lib/types";

type AdminTab = "galeri" | "undangan" | "tamu";

const attendanceLabel: Record<RsvpEntry["attendance"], string> = {
  yes: "Hadir",
  maybe: "Belum pasti",
  no: "Berhalangan",
};

export function AdminApp() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("galeri");

  useEffect(() => {
    fetch("/api/cms/session")
      .then((response) => response.json())
      .then((payload: { authenticated?: boolean }) => {
        setIsAuthenticated(Boolean(payload.authenticated));
      })
      .finally(() => setIsChecking(false));
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const response = await fetch("/api/cms/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setLoginError(payload.error || "Masuk belum berhasil.");
      return;
    }
    setIsAuthenticated(true);
    setPassword("");
  }

  async function handleLogout() {
    await fetch("/api/cms/logout", { method: "POST" });
    setIsAuthenticated(false);
  }

  if (isChecking) {
    return <p className="p-8 text-center text-muted">Menyiapkan CMS...</p>;
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
        <h1 className="font-serif text-3xl text-sapphire-deep">CMS Undangan</h1>
        <p className="mt-2 text-sm text-muted">
          Halaman ini untuk mengatur foto dan data acara. Tamu tidak perlu masuk ke sini.
        </p>
        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Kata sandi CMS"
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-jade"
          />
          <button
            type="submit"
            className="rounded-full bg-jade px-5 py-3 text-sm font-semibold text-white"
          >
            Masuk
          </button>
          {loginError ? <p className="text-sm text-sapphire">{loginError}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] text-jade uppercase">Studio</p>
          <h1 className="font-serif text-3xl text-sapphire-deep">CMS Undangan</h1>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            className="rounded-full border border-line px-4 py-2 text-sm text-ink"
          >
            Lihat undangan
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-sapphire px-4 py-2 text-sm text-white"
          >
            Keluar
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {(
          [
            ["galeri", "Galeri"],
            ["undangan", "Data acara"],
            ["tamu", "Tamu & pesan"],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm ${
              activeTab === tab
                ? "bg-jade text-white"
                : "border border-line text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "galeri" ? <GalleryManager /> : null}
        {activeTab === "undangan" ? <WeddingEditor /> : null}
        {activeTab === "tamu" ? <GuestInbox /> : null}
      </div>
    </main>
  );
}

function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [urlValue, setUrlValue] = useState("");
  const [captionValue, setCaptionValue] = useState("");
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    fetch("/api/gallery")
      .then((response) => response.json())
      .then((payload: { items?: GalleryItem[] }) => setItems(payload.items || []));
  }, []);

  async function persist(nextItems: GalleryItem[]) {
    setItems(nextItems);
    const response = await fetch("/api/gallery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: nextItems }),
    });
    if (!response.ok) {
      setStatusText("Perubahan galeri belum tersimpan.");
      return;
    }
    setStatusText("Galeri sudah diperbarui.");
  }

  async function addFromUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!urlValue.trim()) {
      return;
    }
    await persist([
      ...items,
      {
        id: crypto.randomUUID(),
        src: urlValue.trim(),
        caption: captionValue.trim(),
        order: items.length,
      },
    ]);
    setUrlValue("");
    setCaptionValue("");
  }

  async function addFromUpload(file: File | undefined) {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const payload = (await response.json()) as { src?: string; error?: string };
    if (!response.ok || !payload.src) {
      setStatusText(payload.error || "Unggah foto belum berhasil.");
      return;
    }
    await persist([
      ...items,
      {
        id: crypto.randomUUID(),
        src: payload.src,
        caption: captionValue.trim() || file.name,
        order: items.length,
      },
    ]);
    setCaptionValue("");
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) {
      return;
    }
    const nextItems = [...items];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(target, 0, moved);
    void persist(nextItems);
  }

  return (
    <section className="rounded-3xl border border-line bg-card p-5">
      <h2 className="font-serif text-2xl text-sapphire-deep">Foto galeri</h2>
      <p className="mt-1 text-sm text-muted">
        Tambah dari tautan atau unggah berkas, lalu atur urutan dan keterangan.
      </p>

      <form onSubmit={addFromUrl} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input
          value={urlValue}
          onChange={(event) => setUrlValue(event.target.value)}
          placeholder="https://... atau /uploads/foto.jpg"
          className="rounded-2xl border border-line bg-cream px-4 py-3"
        />
        <input
          value={captionValue}
          onChange={(event) => setCaptionValue(event.target.value)}
          placeholder="Keterangan foto"
          className="rounded-2xl border border-line bg-cream px-4 py-3"
        />
        <button
          type="submit"
          className="rounded-full bg-jade px-4 py-3 text-sm font-semibold text-white"
        >
          Tambah URL
        </button>
      </form>

      <label className="mt-3 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-line px-4 py-4 text-sm text-muted">
        Unggah foto dari perangkat
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            void addFromUpload(file);
            event.currentTarget.value = "";
          }}
        />
      </label>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="pb-3 font-medium">Foto</th>
              <th className="pb-3 font-medium">Keterangan</th>
              <th className="pb-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-t border-line/70">
                <td className="py-3 pr-3">
                  <SmartImage
                    src={item.src}
                    alt={item.caption}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    value={item.caption}
                    onChange={(event) => {
                      const nextItems = items.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, caption: event.target.value }
                          : entry,
                      );
                      setItems(nextItems);
                    }}
                    onBlur={(event) => {
                      const nextItems = items.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, caption: event.target.value }
                          : entry,
                      );
                      void persist(nextItems);
                    }}
                    className="w-full rounded-xl border border-line bg-cream px-3 py-2"
                  />
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      className="rounded-full border border-line px-3 py-1"
                    >
                      Naik
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      className="rounded-full border border-line px-3 py-1"
                    >
                      Turun
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void persist(items.filter((entry) => entry.id !== item.id))
                      }
                      className="rounded-full border border-sapphire/20 px-3 py-1 text-sapphire"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {statusText ? <p className="mt-4 text-sm text-jade-deep">{statusText}</p> : null}
    </section>
  );
}

function WeddingEditor() {
  const [wedding, setWedding] = useState<WeddingContent | null>(null);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    fetch("/api/wedding")
      .then((response) => response.json())
      .then((payload: { wedding?: WeddingContent }) => {
        if (payload.wedding) {
          setWedding(payload.wedding);
        }
      });
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!wedding) {
      return;
    }
    const response = await fetch("/api/wedding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wedding }),
    });
    setStatusText(
      response.ok
        ? "Data undangan sudah disimpan."
        : "Penyimpanan belum berhasil.",
    );
  }

  if (!wedding) {
    return <p className="text-sm text-muted">Memuat data acara...</p>;
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-5 rounded-3xl border border-line bg-card p-5"
    >
      <h2 className="font-serif text-2xl text-sapphire-deep">Data acara</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Nama mempelai wanita"
          value={wedding.bride.name}
          onChange={(value) =>
            setWedding({ ...wedding, bride: { ...wedding.bride, name: value } })
          }
        />
        <TextField
          label="Nama mempelai pria"
          value={wedding.groom.name}
          onChange={(value) =>
            setWedding({ ...wedding, groom: { ...wedding.groom, name: value } })
          }
        />
        <TextField
          label="Nama lengkap wanita"
          value={wedding.bride.fullName}
          onChange={(value) =>
            setWedding({
              ...wedding,
              bride: { ...wedding.bride, fullName: value },
            })
          }
        />
        <TextField
          label="Nama lengkap pria"
          value={wedding.groom.fullName}
          onChange={(value) =>
            setWedding({
              ...wedding,
              groom: { ...wedding.groom, fullName: value },
            })
          }
        />
      </div>
      <TextField
        label="Tanggal & waktu (ISO)"
        value={wedding.weddingDate}
        onChange={(value) => setWedding({ ...wedding, weddingDate: value })}
      />
      <TextField
        label="URL musik YouTube (opsional)"
        value={wedding.music.youtubeUrl}
        onChange={(value) =>
          setWedding({
            ...wedding,
            music: { ...wedding.music, youtubeUrl: value },
          })
        }
      />
      <TextField
        label="Path musik lokal"
        value={wedding.music.localSrc}
        onChange={(value) =>
          setWedding({
            ...wedding,
            music: { ...wedding.music, localSrc: value },
          })
        }
      />
      {wedding.events.map((event, index) => (
        <div key={event.id} className="grid gap-3 rounded-2xl bg-cream p-4 md:grid-cols-2">
          <p className="md:col-span-2 font-medium text-ink">{event.title}</p>
          <TextField
            label="Tempat"
            value={event.venue}
            onChange={(value) => {
              const events = wedding.events.map((entry, eventIndex) =>
                eventIndex === index ? { ...entry, venue: value } : entry,
              );
              setWedding({ ...wedding, events });
            }}
          />
          <TextField
            label="Tautan peta"
            value={event.mapsUrl}
            onChange={(value) => {
              const events = wedding.events.map((entry, eventIndex) =>
                eventIndex === index ? { ...entry, mapsUrl: value } : entry,
              );
              setWedding({ ...wedding, events });
            }}
          />
          <TextField
            label="Tanggal tampilan"
            value={event.dateLabel}
            onChange={(value) => {
              const events = wedding.events.map((entry, eventIndex) =>
                eventIndex === index ? { ...entry, dateLabel: value } : entry,
              );
              setWedding({ ...wedding, events });
            }}
          />
          <TextField
            label="Waktu tampilan"
            value={event.timeLabel}
            onChange={(value) => {
              const events = wedding.events.map((entry, eventIndex) =>
                eventIndex === index ? { ...entry, timeLabel: value } : entry,
              );
              setWedding({ ...wedding, events });
            }}
          />
        </div>
      ))}
      <button
        type="submit"
        className="self-start rounded-full bg-sapphire px-5 py-3 text-sm font-semibold text-white"
      >
        Simpan data acara
      </button>
      {statusText ? <p className="text-sm text-jade-deep">{statusText}</p> : null}
    </form>
  );
}

function GuestInbox() {
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);

  useEffect(() => {
    fetch("/api/rsvp")
      .then((response) => response.json())
      .then((payload: { entries?: RsvpEntry[] }) => setRsvps(payload.entries || []));
    fetch("/api/messages")
      .then((response) => response.json())
      .then((payload: { messages?: GuestbookMessage[] }) =>
        setMessages(payload.messages || []),
      );
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="font-serif text-2xl text-sapphire-deep">RSVP</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="pb-2 font-medium">Nama</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Tamu</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((entry) => (
                <tr key={entry.id} className="border-t border-line/70">
                  <td className="py-2 pr-3">{entry.name}</td>
                  <td className="py-2 pr-3">{attendanceLabel[entry.attendance]}</td>
                  <td className="py-2">{entry.guestCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="font-serif text-2xl text-sapphire-deep">Pesan</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {messages.map((entry) => (
            <li key={entry.id} className="rounded-2xl bg-cream px-4 py-3">
              <p className="font-medium text-ink">{entry.name}</p>
              <p className="mt-1 text-sm text-muted">{entry.message}</p>
              <p className="mt-2 text-xs text-muted">{formatDateTime(entry.createdAt)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-line bg-cream px-4 py-3 outline-none focus:border-jade"
      />
    </label>
  );
}
