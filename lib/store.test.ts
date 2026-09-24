import { beforeEach, describe, expect, test, vi } from "vitest";
import type { GuestbookMessage, RsvpEntry } from "@/lib/types";

const { readJsonDocument, writeJsonDocument } = vi.hoisted(() => ({
  readJsonDocument: vi.fn(),
  writeJsonDocument: vi.fn(),
}));

vi.mock("@/lib/data-store", () => ({
  readJsonDocument,
  writeJsonDocument,
}));

import { deleteMessage, deleteRsvp } from "./store";

const sampleRsvps: RsvpEntry[] = [
  {
    id: "rsvp-1",
    name: "Keluarga Besar Rahman",
    attendance: "yes",
    guestCount: 4,
    message: "Kami hadir.",
    createdAt: "2026-09-01T10:20:00+07:00",
  },
  {
    id: "rsvp-2",
    name: "Nurul Hasanah",
    attendance: "maybe",
    guestCount: 2,
    message: "Sedang menyesuaikan jadwal.",
    createdAt: "2026-09-08T19:45:00+07:00",
  },
];

const sampleMessages: GuestbookMessage[] = [
  {
    id: "msg-1",
    name: "Keluarga Besar Rahman",
    message: "Selamat menempuh hidup baru.",
    approved: true,
    createdAt: "2026-09-01T10:15:00+07:00",
  },
  {
    id: "msg-2",
    name: "Nurul & Fajar",
    message: "Ikut bahagia melihat kalian.",
    approved: true,
    createdAt: "2026-09-08T19:40:00+07:00",
  },
];

beforeEach(() => {
  readJsonDocument.mockReset();
  writeJsonDocument.mockReset();
  writeJsonDocument.mockResolvedValue(undefined);
});

describe("deleteRsvp", () => {
  test("menghapus satu RSVP lalu menulis sisa entri", async () => {
    readJsonDocument.mockResolvedValue([...sampleRsvps]);

    await expect(deleteRsvp("rsvp-1")).resolves.toEqual(sampleRsvps[0]);

    expect(writeJsonDocument).toHaveBeenCalledWith("rsvp.json", [sampleRsvps[1]]);
  });

  test("tidak menulis jika RSVP tidak ditemukan", async () => {
    readJsonDocument.mockResolvedValue([...sampleRsvps]);

    await expect(deleteRsvp("rsvp-missing")).resolves.toBeNull();
    expect(writeJsonDocument).not.toHaveBeenCalled();
  });
});

describe("deleteMessage", () => {
  test("menghapus satu pesan lalu menulis sisa pesan", async () => {
    readJsonDocument.mockResolvedValue([...sampleMessages]);

    await expect(deleteMessage("msg-2")).resolves.toEqual(sampleMessages[1]);

    expect(writeJsonDocument).toHaveBeenCalledWith("messages.json", [
      sampleMessages[0],
    ]);
  });

  test("tidak menulis jika pesan tidak ditemukan", async () => {
    readJsonDocument.mockResolvedValue([...sampleMessages]);

    await expect(deleteMessage("msg-missing")).resolves.toBeNull();
    expect(writeJsonDocument).not.toHaveBeenCalled();
  });
});
