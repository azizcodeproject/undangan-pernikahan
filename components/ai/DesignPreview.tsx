"use client";

import { useMemo } from "react";
import type { DesignTokens } from "@/lib/design-tokens";
import { defaultDesignTokens, applyTheme, presetThemes, tokensToCSSVars } from "@/lib/design-tokens";

interface DesignPreviewProps {
  designDraft: {
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
  weddingData?: Record<string, unknown>;
  className?: string;
}

export function DesignPreview({ designDraft, weddingData, className = "" }: DesignPreviewProps) {
  const previewVars = useMemo(() => {
    let tokens: DesignTokens = { ...defaultDesignTokens };

    if (designDraft.theme && designDraft.theme !== "custom") {
      tokens = applyTheme(tokens, designDraft.theme as keyof typeof presetThemes);
    }

    if (designDraft.colors) {
      tokens = {
        ...tokens,
        colors: { ...tokens.colors, ...designDraft.colors } as DesignTokens["colors"],
      };
    }

    if (designDraft.fonts) {
      tokens = {
        ...tokens,
        fonts: { ...tokens.fonts, ...designDraft.fonts } as DesignTokens["fonts"],
      };
    }

    if (designDraft.spacing) {
      tokens = {
        ...tokens,
        spacing: { ...tokens.spacing, ...designDraft.spacing } as DesignTokens["spacing"],
      };
    }

    if (designDraft.borderRadius) {
      tokens = {
        ...tokens,
        borderRadius: { ...tokens.borderRadius, ...designDraft.borderRadius } as DesignTokens["borderRadius"],
      };
    }

    if (designDraft.shadows) {
      tokens = {
        ...tokens,
        shadows: { ...tokens.shadows, ...designDraft.shadows } as DesignTokens["shadows"],
      };
    }

    if (designDraft.transitions) {
      tokens = {
        ...tokens,
        transitions: { ...tokens.transitions, ...designDraft.transitions } as DesignTokens["transitions"],
      };
    }

    const vars = tokensToCSSVars(tokens, "wd");

    return {
      ...vars,
      "--card": tokens.colors.surface.light,
      "--line": tokens.colors.border.light,
      "--cream": tokens.colors.background.light,
      "--ink": tokens.colors.text.light,
      "--muted": tokens.colors.muted.light,
      "--jade": tokens.colors.primary.light,
      "--sapphire": tokens.colors.secondary.light,
    } as React.CSSProperties & Record<string, string>;
  }, [designDraft]);

  const brideName = (weddingData?.bride as { name?: string })?.name || "Mempelai Wanita";
  const groomName = (weddingData?.groom as { name?: string })?.name || "Mempelai Pria";
  const weddingDate = (weddingData?.weddingDate as string) || new Date().toISOString();
  const tagline = (weddingData?.tagline as string) || "Undangan Pernikahan";
  const openingLine = (weddingData?.openingLine as string) || "Dengan penuh sukacita...";

  const formattedDate = new Date(weddingDate).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-card ${className}`}
      style={{ ...previewVars, minHeight: "420px", maxHeight: "600px" }}
    >
      <div className="absolute inset-0 cover-overlay" />
      <div className="relative flex h-full flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Preview</span>
          <span className="text-xs text-white/60">{designDraft.theme || "default"}</span>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
          <p className="font-accent text-lg text-white/90">{tagline}</p>

          <p className="font-heading text-2xl font-light leading-tight text-white">
            {groomName} <span className="font-accent">&</span> {brideName}
          </p>

          <p className="font-body text-xs leading-relaxed text-white/80 max-w-[16rem]">
            {openingLine}
          </p>

          <div className="mt-2 flex items-center justify-center gap-2 text-white/80">
            <span className="font-body text-xs">📅</span>
            <time className="font-body text-xs" dateTime={weddingDate}>
              {formattedDate}
            </time>
          </div>

          <button className="mt-3 w-full max-w-[12rem] rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
            Lihat Undangan
          </button>
        </main>

        <footer className="px-4 py-2 text-center">
          <p className="text-[10px] text-white/50">
            Preview mode — tampilan final mungkin berbeda
          </p>
        </footer>
      </div>
    </div>
  );
}

export function DesignTokensDisplay({ designDraft }: { designDraft: DesignPreviewProps["designDraft"] }) {
  const tokens = {
    theme: designDraft.theme,
    colors: designDraft.colors,
    fonts: designDraft.fonts,
    layout: designDraft.layout,
    animations: designDraft.animations,
  };

  return (
    <div className="mt-3 rounded-xl border border-line bg-cream/50 p-4 max-h-64 overflow-auto">
      <h4 className="font-serif text-sm text-sapphire-deep mb-2">Design Tokens Aktif</h4>
      <pre className="text-[11px] font-mono bg-white/50 p-3 rounded-xl overflow-auto text-left max-h-44">
        {JSON.stringify(tokens, null, 2)}
      </pre>
    </div>
  );
}
