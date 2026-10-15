"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useMemo, useRef, useState } from "react";
import { DesignPreview, DesignTokensDisplay } from "@/components/ai/DesignPreview";

type DesignDraft = {
  theme?: string;
  colors?: Record<string, { light: string; dark: string }>;
  fonts?: Record<string, string>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
  transitions?: Record<string, string>;
  layout?: {
    coverStyle?: string;
    navStyle?: string;
    sectionSpacing?: string;
  };
  animations?: {
    enableReveal?: boolean;
    revealType?: string;
    parallaxStrength?: number;
  };
};

type ToolOutput = {
  draft?: Record<string, unknown>;
  design?: DesignDraft;
  step?: string;
  wedding?: Record<string, unknown>;
  message?: string;
  success?: boolean;
  issues?: string[];
};

type ToolPartView = {
  toolName: string;
  state?: string;
  input?: unknown;
  output?: ToolOutput;
  errorText?: string;
};

function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .filter(Boolean)
    .join("");
}

function messageToolParts(message: UIMessage): ToolPartView[] {
  return message.parts
    .filter((part) => part.type.startsWith("tool-"))
    .map((part) => {
      const raw = part as unknown as {
        type: string;
        state?: string;
        input?: unknown;
        output?: ToolOutput;
        errorText?: string;
      };
      return {
        toolName: raw.type.replace(/^tool-/, ""),
        state: raw.state,
        input: raw.input,
        output: raw.output,
        errorText: raw.errorText,
      };
    });
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = messageText(message);
  const toolParts = messageToolParts(message);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          isUser ? "bg-sapphire text-white rounded-br-md" : "bg-cream text-ink rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{text || (isUser ? "" : "…")}</p>
        {toolParts.length > 0 && (
          <div className="mt-2 space-y-1">
            {toolParts.map((part, index) => (
              <details key={`${part.toolName}-${index}`} className="text-xs opacity-80">
                <summary className="cursor-pointer flex items-center gap-1">
                  <span className="font-mono">{part.toolName}</span>
                  {part.state && part.state !== "output-available" && (
                    <span className="opacity-60">({part.state})</span>
                  )}
                </summary>
                <pre className="mt-1 p-2 bg-white/20 rounded text-left overflow-auto max-h-32">
                  {JSON.stringify(part.input ?? null, null, 2)}
                </pre>
                {part.output && (
                  <pre className="mt-1 p-2 bg-white/20 rounded text-left overflow-auto max-h-32">
                    {JSON.stringify(part.output, null, 2)}
                  </pre>
                )}
                {part.errorText && <p className="mt-1 text-red-700">{part.errorText}</p>}
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex justify-start">
      <div className="bg-cream text-ink px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-sapphire animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-sapphire animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-sapphire animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-sm text-muted ml-2">{label}</span>
      </div>
    </div>
  );
}

export function WeddingChat() {
  const [showDraft, setShowDraft] = useState(false);
  const [showDesignPanel, setShowDesignPanel] = useState(true);
  const [input, setInput] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const lastSavedRef = useRef<string | null>(null);
  const failedPayloadsRef = useRef<Set<string>>(new Set());

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/ai" }), []);

  const { messages, sendMessage, status, error, setMessages, stop } = useChat({
    transport,
  });

  const { draftData, designDraft, currentStep } = useMemo(() => {
    let draft: Record<string, unknown> | null = null;
    let design: DesignDraft = {};
    let step = "names";
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of messageToolParts(message)) {
        if (part.state !== "output-available" || !part.output) continue;
        if (part.output.draft) draft = part.output.draft;
        if (part.output.design) design = part.output.design;
        if (part.output.step) step = part.output.step;
      }
    }
    return { draftData: draft, designDraft: design, currentStep: step };
  }, [messages]);

  const saveToServer = useCallback(async (wedding: unknown) => {
    const payload = JSON.stringify(wedding);
    if (lastSavedRef.current === payload || failedPayloadsRef.current.has(payload)) {
      return;
    }

    setSaveState("saving");
    setSaveError(null);
    try {
      const response = await fetch("/api/wedding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wedding }),
      });
      if (!response.ok) {
        throw new Error(`Gagal menyimpan (HTTP ${response.status})`);
      }
      lastSavedRef.current = payload;
      setSaveState("saved");
    } catch (err) {
      failedPayloadsRef.current.add(payload);
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan draft.");
      setSaveState("error");
    }
  }, []);

  const busy = status === "submitted" || status === "streaming";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage(
      { text },
      {
        body: {
          draft: draftData,
          designDraft,
          step: currentStep,
        },
      },
    );
  };

  const handleReset = () => {
    setMessages([]);
    setSaveState("idle");
    setSaveError(null);
    lastSavedRef.current = null;
    failedPayloadsRef.current.clear();
  };

  const handleManualSave = () => {
    if (draftData) void saveToServer(draftData);
  };

  const chatList = (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {busy && <TypingIndicator label="AI sedang mengetik..." />}
      {error && (
        <div className="flex justify-center">
          <div className="bg-sapphire/10 border border-sapphire/20 text-sapphire px-4 py-2 rounded-xl text-sm">
            {error.message || "Terjadi kesalahan. Coba lagi."}
          </div>
        </div>
      )}
      {saveState === "error" && saveError && (
        <div className="flex justify-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm">
            {saveError}
          </div>
        </div>
      )}
    </div>
  );

  const inputForm = (
    <form onSubmit={handleSubmit} className="p-4 border-t border-line bg-cream/50">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ceritakan detail undanganmu... (contoh: nama kita Yusuf & Sintia, nikah 12 Des 2026, tema elegant warna emas)"
          className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-jade placeholder:text-neutral-400"
          disabled={busy}
          autoFocus
        />
        {busy ? (
          <button
            type="button"
            onClick={() => void stop()}
            className="rounded-full bg-sapphire px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-full bg-jade px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-jade-deep transition"
          >
            Kirim
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted text-center">
        Tip: Jawab natural aja, AI bakal ekstrak info & isi draft otomatis. Step sekarang:{" "}
        <strong>{getStepLabel(currentStep)}</strong>
      </p>
    </form>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-card rounded-3xl border border-line overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-line bg-cream/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-jade to-sapphire flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-serif text-xl text-sapphire-deep">AI Wedding Planner</h2>
            <p className="text-xs text-muted">
              Step: {currentStep} - {getStepLabel(currentStep)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDraft(!showDraft)}
            className="rounded-xl border border-line px-3 py-1 text-xs text-muted hover:bg-cream transition"
          >
            {showDraft ? "Sembunyikan Draft" : "Lihat Draft"}
          </button>
          <button
            onClick={() => setShowDesignPanel(!showDesignPanel)}
            className="rounded-xl border border-line px-3 py-1 text-xs text-muted hover:bg-cream transition"
          >
            {showDesignPanel ? "Sembunyikan Preview" : "Lihat Preview"}
          </button>
          <button
            onClick={handleReset}
            className="rounded-xl border border-sapphire/20 px-3 py-1 text-xs text-sapphire hover:bg-sapphire/5 transition"
          >
            Reset Chat
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {showDesignPanel ? (
          <div className="flex h-full">
            <div className="flex-1 flex flex-col min-w-0">
              {chatList}
              {inputForm}
            </div>

            <div
              className="w-[380px] border-l border-line bg-card/50 flex flex-col"
              style={{ minWidth: "320px", maxWidth: "420px" }}
            >
              <div className="p-4 border-b border-line bg-cream/50 flex items-center justify-between">
                <h3 className="font-serif text-lg text-sapphire-deep">Live Preview</h3>
                <button
                  onClick={() => setShowDesignPanel(false)}
                  className="p-1 rounded hover:bg-cream transition"
                  title="Tutup preview"
                >
                  <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <DesignPreview designDraft={designDraft} weddingData={draftData || undefined} className="h-[400px]" />
                <DesignTokensDisplay designDraft={designDraft} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            {chatList}
            <div className="p-4 border-t border-line bg-cream/50 flex items-center justify-between">
              <button
                onClick={() => setShowDesignPanel(true)}
                className="rounded-xl border border-jade/30 px-4 py-2 text-sm text-jade-deep hover:bg-jade/5 transition"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Buka Preview
              </button>
            </div>
            {inputForm}
          </div>
        )}
      </div>

      {showDraft && draftData && (
        <div className="border-t border-line p-4 bg-cream/30 max-h-64 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg text-sapphire-deep">Draft JSON Undangan</h3>
            <div className="flex items-center gap-3 text-xs">
              {saveState === "saving" && <span className="text-muted">Menyimpan...</span>}
              {saveState === "saved" && <span className="text-jade">Tersimpan di server</span>}
              <button onClick={handleManualSave} className="text-jade-deep hover:underline">
                Simpan ke Server
              </button>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(JSON.stringify(draftData, null, 2));
                }}
                className="text-sapphire hover:underline"
              >
                Copy JSON
              </button>
            </div>
          </div>
          <pre className="text-xs font-mono bg-white/50 p-3 rounded-xl overflow-auto max-h-48 text-left text-neutral-900">
            {JSON.stringify(draftData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function getStepLabel(step: string): string {
  const labels: Record<string, string> = {
    names: "Nama Mempelai & Orang Tua",
    date_venue: "Tanggal, Sampul, Foto & Musik",
    events: "Jadwal Acara",
    story: "Cerita Cinta",
    quran: "Ayat Al-Quran",
    gift: "Rekening Hadiah",
    design: "Tema, Warna, Font, Layout, Animasi",
    complete: "Selesai - Siap Publish",
  };
  return labels[step] || step;
}
