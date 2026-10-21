import type { WeddingContent } from "@/lib/types";

export function emptyWeddingContent(): WeddingContent {
  return {
    bride: { name: "", fullName: "", parents: "" },
    groom: { name: "", fullName: "", parents: "" },
    tagline: "",
    openingLine: "",
    closingLine: "",
    coverImage: "",
    couplePortrait: "",
    weddingDate: "",
    music: { localSrc: "", youtubeUrl: "" },
    events: [],
    story: [],
    quran: [],
    gift: { note: "", accounts: [] },
  };
}

export function sampleWeddingContent(): WeddingContent {
  return {
    ...emptyWeddingContent(),
    bride: { name: "Sintia", fullName: "Sintia", parents: "" },
    groom: { name: "Yusuf", fullName: "Yusuf", parents: "" },
    tagline: "Undangan contoh",
    openingLine: "Dengan penuh rasa syukur kami mengundang Anda.",
    closingLine: "Terima kasih atas doa dan restunya.",
    weddingDate: new Date(Date.now() + 90 * 86400000).toISOString(),
  };
}
