import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import {
  getLanguageModel,
  missingKeyMessage,
  resolveProvider,
} from "@/lib/ai/provider";
import { revalidatePath } from "next/cache";
import { cmsUnauthorizedResponse, requireCmsAuth } from "@/lib/auth";
import { writeWedding } from "@/lib/store";
import type { WeddingContent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const steps = [
  "names",
  "date_venue",
  "events",
  "story",
  "quran",
  "gift",
  "design",
  "complete",
] as const;

type Step = (typeof steps)[number];

const stepSchema = z.enum(steps);
const themeNames = [
  "elegant",
  "romantic",
  "modern",
  "traditional",
  "minimal",
  "nature",
  "custom",
] as const;

const personProfileSchema = z.object({
  name: z.string(),
  fullName: z.string(),
  parents: z.string(),
});

const weddingEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  dateLabel: z.string(),
  timeLabel: z.string(),
  venue: z.string(),
  address: z.string(),
  mapsUrl: z.string(),
});

const storyChapterSchema = z.object({
  id: z.string(),
  dateLabel: z.string(),
  title: z.string(),
  body: z.string(),
});

const quranAyahSchema = z.object({
  id: z.string(),
  surah: z.string(),
  reference: z.string(),
  arabic: z.string(),
  latin: z.string(),
  meaning: z.string(),
});

const weddingContentSchema = z.object({
  bride: personProfileSchema,
  groom: personProfileSchema,
  tagline: z.string(),
  openingLine: z.string(),
  closingLine: z.string(),
  coverImage: z.string(),
  couplePortrait: z.string(),
  weddingDate: z.string(),
  music: z.object({ localSrc: z.string(), youtubeUrl: z.string() }),
  events: z.array(weddingEventSchema),
  story: z.array(storyChapterSchema),
  quran: z.array(quranAyahSchema),
  gift: z.object({
    note: z.string(),
    accounts: z.array(
      z.object({
        id: z.string(),
        bankName: z.string(),
        accountName: z.string(),
        accountNumber: z.string(),
      }),
    ),
  }),
});

type WeddingDraft = z.infer<typeof weddingContentSchema>;

type DesignState = {
  theme: string;
  colors: Record<string, { light: string; dark: string }>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
  layout: { coverStyle: string; navStyle: string; sectionSpacing: string };
  animations: {
    enableReveal: boolean;
    revealType: string;
    parallaxStrength: number;
  };
};

function defaultWeddingData(): WeddingDraft {
  return {
    bride: { name: "", fullName: "", parents: "" },
    groom: { name: "", fullName: "", parents: "" },
    tagline: "Undangan Pernikahan",
    openingLine:
      "Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan merayakan hari bahagia kami.",
    closingLine:
      "Kehadiran dan ucapan Anda adalah hadiah yang paling berarti. Terima kasih sudah menempuh jalan ke hari kami.",
    coverImage: "/images/cover.jpg",
    couplePortrait: "",
    weddingDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    music: { localSrc: "/music/background.mp3", youtubeUrl: "" },
    events: [],
    story: [],
    quran: [],
    gift: {
      note: "Doa restu Anda sudah lebih dari cukup. Jika berkenan memberi tanda kasih, berikut rekening yang bisa digunakan.",
      accounts: [],
    },
  };
}

function defaultDesignData(): DesignState {
  return {
    theme: "elegant",
    colors: {},
    fonts: {},
    spacing: {},
    borderRadius: {},
    shadows: {},
    transitions: {},
    layout: { coverStyle: "fullscreen", navStyle: "fixed", sectionSpacing: "normal" },
    animations: { enableReveal: true, revealType: "fade", parallaxStrength: 0.3 },
  };
}

const draftKeys = Object.keys(defaultWeddingData()) as (keyof WeddingDraft)[];
const objectKeys: (keyof WeddingDraft)[] = [
  "bride",
  "groom",
  "music",
  "gift",
];
const arrayKeys: (keyof WeddingDraft)[] = ["events", "story", "quran"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeDraft(value: unknown): WeddingDraft {
  const draft = defaultWeddingData();
  if (!isRecord(value)) return draft;

  for (const key of draftKeys) {
    const incoming = value[key];
    if (incoming === undefined || incoming === null) continue;

    if (objectKeys.includes(key)) {
      if (isRecord(incoming)) {
        draft[key] = { ...(draft[key] as object), ...incoming } as never;
      }
    } else if (arrayKeys.includes(key)) {
      if (Array.isArray(incoming)) {
        draft[key] = incoming.filter(isRecord) as never;
      }
    } else if (typeof incoming === "string") {
      draft[key] = incoming as never;
    }
  }

  return draft;
}

const colorEntry = z.object({ light: z.string(), dark: z.string() });

function sanitizeDesign(value: unknown): DesignState {
  const design = defaultDesignData();
  if (!isRecord(value)) return design;

  if (
    typeof value.theme === "string" &&
    (themeNames as readonly string[]).includes(value.theme)
  ) {
    design.theme = value.theme;
  }

  const colorGroups = ["colors", "fonts", "spacing", "borderRadius", "shadows", "transitions"];
  for (const group of colorGroups) {
    const raw = value[group];
    if (!isRecord(raw)) continue;
    const target = design[group as keyof DesignState] as unknown as Record<string, unknown>;
    for (const [key, entry] of Object.entries(raw)) {
      if (group === "colors") {
        const parsed = colorEntry.safeParse(entry);
        if (parsed.success) target[key] = parsed.data;
      } else if (typeof entry === "string") {
        target[key] = entry;
      }
    }
  }

  if (isRecord(value.layout)) {
    const allowed: Record<string, readonly string[]> = {
      coverStyle: ["fullscreen", "split", "minimal", "parallax"],
      navStyle: ["fixed", "floating", "sidebar", "none"],
      sectionSpacing: ["compact", "normal", "spacious"],
    };
    for (const [key, options] of Object.entries(allowed)) {
      const incoming = value.layout[key];
      if (typeof incoming === "string" && options.includes(incoming)) {
        design.layout[key as keyof DesignState["layout"]] = incoming;
      }
    }
  }

  if (isRecord(value.animations)) {
    const { enableReveal, revealType, parallaxStrength } = value.animations;
    if (typeof enableReveal === "boolean") design.animations.enableReveal = enableReveal;
    if (
      typeof revealType === "string" &&
      ["fade", "slide", "scale", "blur"].includes(revealType)
    ) {
      design.animations.revealType = revealType;
    }
    if (
      typeof parallaxStrength === "number" &&
      parallaxStrength >= 0 &&
      parallaxStrength <= 1
    ) {
      design.animations.parallaxStrength = parallaxStrength;
    }
  }

  return design;
}

function clampStep(value: unknown): Step {
  return stepSchema.safeParse(value).success ? (value as Step) : "names";
}

function describeStreamError(error: unknown): string {
  let message = "Terjadi kesalahan saat memanggil AI.";
  let status: number | undefined;

  if (error instanceof Error) {
    message = error.message || message;
    const maybe = error as Error & { statusCode?: number };
    if (typeof maybe.statusCode === "number") status = maybe.statusCode;
  } else if (typeof error === "string" && error.trim()) {
    message = error;
  }

  message = message
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, "AIza***")
    .slice(0, 300);

  const provider = resolveProvider();
  const keyHint = provider.apiKeyEnv ? ` Periksa nilai ${provider.apiKeyEnv}.` : "";

  if (status === 401) {
    return `API key ditolak ${provider.label} (401).${keyHint} Detail: ${message}`;
  }
  if (status === 403) {
    return `API key tidak punya akses (403).${keyHint} Detail: ${message}`;
  }
  if (status === 404) {
    return `Model tidak ditemukan (404). Periksa AI_MODEL (sekarang: ${provider.modelId}). Detail: ${message}`;
  }
  if (status === 429) {
    return `Rate limit / kuota ${provider.label} habis (429). Coba lagi nanti. Detail: ${message}`;
  }
  if (
    status === 503 ||
    /high demand|unavailable|overloaded/i.test(message)
  ) {
    return `Model ${provider.label} sedang sibuk. Semua model cadangan juga gagal, jadi coba lagi 1–2 menit. Detail: ${message}`;
  }
  if (status && status >= 500) {
    return `${provider.label} server error (${status}). Detail: ${message}`;
  }
  return message;
}

function getNextStep(current: Step): Step {
  const index = steps.indexOf(current);
  return steps[Math.min(index + 1, steps.length - 1)];
}

function getStepDescription(step: Step): string {
  const descriptions: Record<Step, string> = {
    names: "Nama mempelai & orang tua",
    date_venue: "Tanggal, sampul, foto pasangan, & musik",
    events: "Jadwal acara (akad, resepsi, dll)",
    story: "Cerita cinta (timeline)",
    quran: "Ayat Al-Quran",
    gift: "Rekening hadiah",
    design: "Tema, warna, font, layout, animasi",
    complete: "Selesai - siap publish",
  };
  return descriptions[step];
}

function validationIssues(draft: WeddingDraft): string[] {
  const parsed = weddingContentSchema.safeParse(draft);
  if (parsed.success) return [];
  return parsed.error.issues
    .slice(0, 12)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

function mergeDraft(
  current: WeddingDraft,
  data: Record<string, unknown>,
): WeddingDraft {
  const next: WeddingDraft = { ...current };
  for (const key of draftKeys) {
    const incoming = data[key];
    if (incoming === undefined || incoming === null) continue;

    if (objectKeys.includes(key)) {
      if (isRecord(incoming)) {
        next[key] = { ...(next[key] as object), ...incoming } as never;
      }
    } else if (arrayKeys.includes(key)) {
      if (Array.isArray(incoming)) {
        next[key] = incoming.filter(isRecord) as never;
      }
    } else if (typeof incoming === "string") {
      next[key] = incoming as never;
    }
  }
  return next;
}

function buildSystemPrompt(
  step: Step,
  draft: WeddingDraft,
  design: DesignState,
): string {
  return `Kamu adalah **AI Wedding Planner** yang membantu pasangan membuat undangan pernikahan digital LENGKAP (isi konten + desain).

**Aturan wajib:**
1. TANYAKAN satu hal per satu - jangan minta semua sekaligus.
2. Gunakan TOOLS untuk mengubah data (updateWeddingData, updateTheme, updateTypography, updateLayout, updateAnimations, nextStep). Data TIDAK berubah kecuali lewat tool.
3. Setiap kali memanggil tool, WAJIB mengakhiri respons dengan pesan teks singkat berbahasa Indonesia: konfirmasi perubahan + SATU pertanyaan langkah berikutnya.
4. Ramah, suportif, profesional. Bahasa Indonesia (campur English jika user memakai English).
5. Tool saveWedding hanya dipakai kalau user minta simpan/publish.
6. Jangan mengulang pertanyaan yang sudah dijawab - cek isi draft di bawah.

**Urutan step:**
${steps.map((s, i) => `${i + 1}. ${s}: ${getStepDescription(s)}`).join("\n")}

**Step saat ini:** ${step} - ${getStepDescription(step)}

**Draft isi (dari client):**
${JSON.stringify(draft, null, 2)}

**Draft desain (dari client):**
${JSON.stringify(design, null, 2)}

**Preset tema:** ${themeNames.join(", ")}
**Cover style:** fullscreen, split, minimal, parallax
**Nav style:** fixed, floating, sidebar, none
**Section spacing:** compact, normal, spacious
**Reveal type:** fade, slide, scale, blur

**Contoh (isi):**
- User: "Nama saya Yusuf, pacar saya Sintia"
- Kamu: tanya nama lengkap & orang tua via updateWeddingData, lalu nextStep kalau sudah lengkap.

**Contoh (desain):**
- User: "Buat elegant, emas & navy, font serif"
- Kamu: updateTheme + updateTypography + updateAnimations, lalu tanya konfirmasi.

**Jika user kirim data lengkap sekaligus:** parse semua, update lewat tool dalam satu putaran, lalu rangkum + tanya hal terakhir yang belum ada.`;
}

export async function POST(request: Request) {
  if (!(await requireCmsAuth())) {
    return cmsUnauthorizedResponse();
  }

  const provider = resolveProvider();
  if (!provider.configured) {
    return Response.json(
      { error: missingKeyMessage(provider) },
      { status: 500 },
    );
  }

  let body: {
    messages?: unknown;
    draft?: unknown;
    designDraft?: unknown;
    step?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body bukan JSON valid." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages)
    ? (body.messages as UIMessage[])
    : [];
  if (messages.length === 0) {
    return Response.json(
      { error: "Pesan kosong." },
      { status: 400 },
    );
  }

  let currentDraft = sanitizeDraft(body.draft);
  let currentDesign = sanitizeDesign(body.designDraft);
  let currentStep = clampStep(body.step);

  const tools = {
    updateWeddingData: tool({
      description:
        "Update sebagian data undangan (bride, groom, tagline, weddingDate, events, story, quran, gift, music, dll)",
      inputSchema: z.object({
        data: z
          .record(z.string(), z.unknown())
          .describe("Bagian data yang diubah, key sama seperti draft"),
        description: z
          .string()
          .describe("Penjelasan singkat perubahan dalam bahasa Indonesia"),
      }),
      execute: async ({ data, description }) => {
        currentDraft = mergeDraft(currentDraft, data);
        return {
          success: true,
          message: `Data diupdate: ${description}`,
          step: currentStep,
          draft: currentDraft,
          issues: validationIssues(currentDraft),
        };
      },
    }),

    nextStep: tool({
      description:
        "Pindah ke step berikutnya (atau step tertentu) setelah data step saat ini lengkap",
      inputSchema: z.object({
        reason: z.string().describe("Alasan pindah step"),
        target: stepSchema.optional().describe("Step tujuan, default step berikutnya"),
      }),
      execute: async ({ reason, target }) => {
        currentStep = target ?? getNextStep(currentStep);
        return {
          success: true,
          message: `Step selanjutnya: ${currentStep} - ${getStepDescription(currentStep)}`,
          reason,
          step: currentStep,
        };
      },
    }),

    updateTheme: tool({
      description:
        "Ganti tema preset (elegant, romantic, modern, traditional, minimal, nature) atau warna custom",
      inputSchema: z.object({
        themeName: z.enum(themeNames).optional(),
        customColors: z
          .record(
            z.string(),
            z.object({ light: z.string(), dark: z.string() }),
          )
          .optional()
          .describe("Warna custom per token (primary, accent, background, dll)"),
        description: z.string().describe("Penjelasan perubahan tema"),
      }),
      execute: async ({ themeName, customColors, description }) => {
        if (themeName) currentDesign.theme = themeName;
        if (customColors) {
          currentDesign.colors = { ...currentDesign.colors, ...customColors };
        }
        return {
          success: true,
          message: `Tema diupdate: ${description}`,
          design: currentDesign,
        };
      },
    }),

    updateTypography: tool({
      description: "Ganti font heading, body, arabic, atau accent",
      inputSchema: z.object({
        fonts: z
          .record(z.string(), z.string())
          .describe("CSS font-family per peran (heading, body, arabic, accent)"),
        description: z.string().describe("Penjelasan perubahan font"),
      }),
      execute: async ({ fonts, description }) => {
        currentDesign.fonts = { ...currentDesign.fonts, ...fonts };
        return {
          success: true,
          message: `Font diupdate: ${description}`,
          design: currentDesign,
        };
      },
    }),

    updateLayout: tool({
      description: "Atur layout komponen undangan",
      inputSchema: z.object({
        coverStyle: z.enum(["fullscreen", "split", "minimal", "parallax"]).optional(),
        navStyle: z.enum(["fixed", "floating", "sidebar", "none"]).optional(),
        sectionSpacing: z.enum(["compact", "normal", "spacious"]).optional(),
        description: z.string().describe("Penjelasan perubahan layout"),
      }),
      execute: async ({ coverStyle, navStyle, sectionSpacing, description }) => {
        if (coverStyle) currentDesign.layout.coverStyle = coverStyle;
        if (navStyle) currentDesign.layout.navStyle = navStyle;
        if (sectionSpacing) currentDesign.layout.sectionSpacing = sectionSpacing;
        return {
          success: true,
          message: `Layout diupdate: ${description}`,
          design: currentDesign,
        };
      },
    }),

    updateAnimations: tool({
      description: "Konfigurasi animasi dan motion",
      inputSchema: z.object({
        enableReveal: z.boolean().optional(),
        revealType: z.enum(["fade", "slide", "scale", "blur"]).optional(),
        parallaxStrength: z.number().min(0).max(1).optional(),
        description: z.string().describe("Penjelasan perubahan animasi"),
      }),
      execute: async ({ enableReveal, revealType, parallaxStrength, description }) => {
        if (enableReveal !== undefined) {
          currentDesign.animations.enableReveal = enableReveal;
        }
        if (revealType) currentDesign.animations.revealType = revealType;
        if (parallaxStrength !== undefined) {
          currentDesign.animations.parallaxStrength = parallaxStrength;
        }
        return {
          success: true,
          message: `Animasi diupdate: ${description}`,
          design: currentDesign,
        };
      },
    }),

    saveWedding: tool({
      description:
        "Simpan draft undangan ke server (dipanggil hanya saat user minta simpan/publish)",
      inputSchema: z.object({
        note: z.string().describe("Catatan singkat untuk user"),
      }),
      execute: async ({ note }) => {
        const issues = validationIssues(currentDraft);
        if (issues.length > 0) {
          return {
            success: false,
            message: `Belum bisa simpan, data belum lengkap: ${issues.join("; ")}`,
            issues,
            step: currentStep,
          };
        }
        try {
          await writeWedding(currentDraft as unknown as WeddingContent);
          try {
            revalidatePath("/");
            revalidatePath("/admin");
          } catch {
            // revalidate is best-effort while the stream is open
          }
          return {
            success: true,
            message: `Undangan berhasil disimpan ke server. ${note}`,
            wedding: currentDraft,
            step: currentStep,
          };
        } catch (error) {
          return {
            success: false,
            message:
              "Gagal menyimpan ke server. Kamu bisa lanjut dulu, user juga bisa klik Simpan manual di panel draft.",
            error: String(error),
            step: currentStep,
          };
        }
      },
    }),

    resetDraft: tool({
      description: "Reset seluruh draft isi & desain ke awal (step names)",
      inputSchema: z.object({
        reason: z.string().describe("Alasan reset"),
      }),
      execute: async ({ reason }) => {
        currentDraft = defaultWeddingData();
        currentDesign = defaultDesignData();
        currentStep = "names";
        return {
          success: true,
          message: "Draft direset. Mulai dari nama mempelai.",
          reason,
          step: currentStep,
          draft: currentDraft,
          design: currentDesign,
        };
      },
    }),
  };

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages, { tools });
  } catch {
    return Response.json(
      { error: "Riwayat pesan tidak valid." },
      { status: 400 },
    );
  }

  const result = streamText({
    model: getLanguageModel(),
    system: buildSystemPrompt(currentStep, currentDraft, currentDesign),
    tools,
    messages: modelMessages,
    stopWhen: stepCountIs(8),
    maxRetries: 1,
    onError: ({ error }) => {
      console.error("AI stream error:", error);
    },
  });

  return result.toUIMessageStreamResponse({
    onError: describeStreamError,
  });
}
