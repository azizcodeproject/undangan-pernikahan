import { readJsonDocument, writeJsonDocument } from "@/lib/data-store";
import type {
  GalleryItem,
  GuestbookMessage,
  RsvpEntry,
  WeddingContent,
} from "@/lib/types";

export async function readWedding(): Promise<WeddingContent> {
  return readJsonDocument<WeddingContent>("wedding.json");
}

export async function writeWedding(wedding: WeddingContent): Promise<void> {
  await writeJsonDocument("wedding.json", wedding);
}

export async function readGallery(): Promise<GalleryItem[]> {
  const items = await readJsonDocument<GalleryItem[]>("gallery.json");
  return [...items].sort((left, right) => left.order - right.order);
}

export async function writeGallery(items: GalleryItem[]): Promise<void> {
  const normalized = items.map((item, index) => ({
    ...item,
    order: index,
  }));
  await writeJsonDocument("gallery.json", normalized);
}

export async function readMessages(): Promise<GuestbookMessage[]> {
  return readJsonDocument<GuestbookMessage[]>("messages.json");
}

export async function writeMessages(
  messages: GuestbookMessage[],
): Promise<void> {
  await writeJsonDocument("messages.json", messages);
}

export async function readRsvps(): Promise<RsvpEntry[]> {
  return readJsonDocument<RsvpEntry[]>("rsvp.json");
}

export async function writeRsvps(entries: RsvpEntry[]): Promise<void> {
  await writeJsonDocument("rsvp.json", entries);
}

export async function appendRsvp(entry: RsvpEntry): Promise<RsvpEntry> {
  const existing = await readRsvps();
  existing.push(entry);
  await writeRsvps(existing);
  return entry;
}

export async function appendMessage(
  message: GuestbookMessage,
): Promise<GuestbookMessage> {
  const existing = await readMessages();
  existing.push(message);
  await writeMessages(existing);
  return message;
}

export async function deleteRsvp(id: string): Promise<RsvpEntry | null> {
  return deleteEntryById(await readRsvps(), id, writeRsvps);
}

export async function deleteMessage(
  id: string,
): Promise<GuestbookMessage | null> {
  return deleteEntryById(await readMessages(), id, writeMessages);
}

async function deleteEntryById<T extends { id: string }>(
  entries: T[],
  id: string,
  persistEntries: (remaining: T[]) => Promise<void>,
): Promise<T | null> {
  const removed = entries.find((entry) => entry.id === id);
  if (!removed) {
    return null;
  }

  await persistEntries(entries.filter((entry) => entry.id !== id));
  return removed;
}
