export type PersonProfile = {
  name: string;
  fullName: string;
  parents: string;
};

export type WeddingEvent = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  venue: string;
  address: string;
  mapsUrl: string;
};

export type StoryChapter = {
  id: string;
  dateLabel: string;
  title: string;
  body: string;
};

export type QuranAyah = {
  id: string;
  surah: string;
  reference: string;
  arabic: string;
  latin: string;
  meaning: string;
};

export type WeddingMusic = {
  localSrc: string;
  youtubeUrl: string;
};

export type WeddingContent = {
  bride: PersonProfile;
  groom: PersonProfile;
  tagline: string;
  openingLine: string;
  closingLine: string;
  coverImage: string;
  couplePortrait: string;
  weddingDate: string;
  music: WeddingMusic;
  events: WeddingEvent[];
  story: StoryChapter[];
  quran: QuranAyah[];
};

export type GalleryItem = {
  id: string;
  src: string;
  caption: string;
  order: number;
};

export type AttendanceStatus = "yes" | "no" | "maybe";

export type RsvpEntry = {
  id: string;
  name: string;
  attendance: AttendanceStatus;
  guestCount: number;
  message: string;
  createdAt: string;
};

export type GuestbookMessage = {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  createdAt: string;
};
