import { promises as fs } from "fs";
import path from "path";
import type {
  GalleryItem,
  GuestbookMessage,
  RsvpEntry,
  WeddingContent,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");

async function readJsonFile<T>(fileName: string): Promise<T> {
  const filePath = path.join(dataDirectory, fileName);
  const rawContent = await fs.readFile(filePath, "utf8");
  return JSON.parse(rawContent) as T;
}

async function writeJsonFile(fileName: string, value: unknown): Promise<void> {
  await fs.mkdir(dataDirectory, { recursive: true });
  const filePath = path.join(dataDirectory, fileName);
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(temporaryPath, serialized, "utf8");
  await fs.rename(temporaryPath, filePath);
}

export async function readWedding(): Promise<WeddingContent> {
  return readJsonFile<WeddingContent>("wedding.json");
}

export async function writeWedding(wedding: WeddingContent): Promise<void> {
  await writeJsonFile("wedding.json", wedding);
}

export async function readGallery(): Promise<GalleryItem[]> {
  const items = await readJsonFile<GalleryItem[]>("gallery.json");
  return [...items].sort((left, right) => left.order - right.order);
}

export async function writeGallery(items: GalleryItem[]): Promise<void> {
  const normalized = items.map((item, index) => ({
    ...item,
    order: index,
  }));
  await writeJsonFile("gallery.json", normalized);
}

export async function readMessages(): Promise<GuestbookMessage[]> {
  return readJsonFile<GuestbookMessage[]>("messages.json");
}

export async function writeMessages(
  messages: GuestbookMessage[],
): Promise<void> {
  await writeJsonFile("messages.json", messages);
}

export async function readRsvps(): Promise<RsvpEntry[]> {
  return readJsonFile<RsvpEntry[]>("rsvp.json");
}

export async function writeRsvps(entries: RsvpEntry[]): Promise<void> {
  await writeJsonFile("rsvp.json", entries);
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
