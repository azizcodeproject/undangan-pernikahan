"use client";

import { useEffect, useMemo, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const tokens = useMemo(() => {
    let result: DesignTokens = { ...defaultDesignTokens };

    if (designDraft.theme && designDraft.theme !== "custom") {
      result = applyTheme(result, designDraft.theme as keyof typeof presetThemes);
    }

    if (designDraft.colors) {
      result = {
        ...result,
        colors: { ...result.colors, ...designDraft.colors } as DesignTokens["colors"],
      };
    }

    if (designDraft.fonts) {
      result = {
        ...result,
        fonts: { ...result.fonts, ...designDraft.fonts } as DesignTokens["fonts"],
      };
    }

    if (designDraft.spacing) {
      result = {
        ...result,
        spacing: { ...result.spacing, ...designDraft.spacing } as DesignTokens["spacing"],
      };
    }

    if (designDraft.borderRadius) {
      result = {
        ...result,
        borderRadius: { ...result.borderRadius, ...designDraft.borderRadius } as DesignTokens["borderRadius"],
      };
    }

    if (designDraft.shadows) {
      result = {
        ...result,
        shadows: { ...result.shadows, ...designDraft.shadows } as DesignTokens["shadows"],
      };
    }

    if (designDraft.transitions) {
      result = {
        ...result,
        transitions: { ...result.transitions, ...designDraft.transitions } as DesignTokens["transitions"],
      };
    }

    return result;
  }, [designDraft]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cssVars = tokensToCSSVars(tokens, "wd");

    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      containerRef.current.appendChild(styleRef.current);
    }

    let css = ".wd-preview-scope {\n";
    for (const [key, value] of Object.entries(cssVars)) {
      css += `  ${key}: ${value};\n`;
    }
    css += `  --card: ${tokens.colors.surface.light};\n`;
    css += `  --line: ${tokens.colors.border.light};\n`;
    css += `  --cream: ${tokens.colors.background.light};\n`;
    css += `  --ink: ${tokens.colors.text.light};\n`;
    css += `  --muted: ${tokens.colors.muted.light};\n`;
    css += `  --jade: ${tokens.colors.primary.light};\n`;
    css += `  --sapphire: ${tokens.colors.secondary.light};\n`;
    css += `  --jade-deep: color-mix(in srgb, ${tokens.colors.primary.light} 80%, black);\n`;
    css += `  --sapphire-deep: color-mix(in srgb, ${tokens.colors.secondary.light} 80%, black);\n`;
    css += "}\n";
    css += `.wd-preview-scope .font-heading { font-family: var(--wd-font-heading, "Playfair Display", serif); }\n`;
    css += `.wd-preview-scope .font-accent { font-family: var(--wd-font-accent, "Great Vibes", cursive); }\n`;
    css += `.wd-preview-scope .font-body { font-family: var(--wd-font-body, "Inter", sans-serif); }\n`;

    css += `@media (prefers-color-scheme: dark) {
  .wd-preview-scope {
    --card: ${tokens.colors.surface.dark};
    --line: ${tokens.colors.border.dark};
    --cream: ${tokens.colors.background.dark};
    --ink: ${tokens.colors.text.dark};
    --muted: ${tokens.colors.muted.dark};
    --jade: ${tokens.colors.primary.dark};
    --sapphire: ${tokens.colors.secondary.dark};
    --jade-deep: color-mix(in srgb, ${tokens.colors.primary.dark} 80%, white);
    --sapphire-deep: color-mix(in srgb, ${tokens.colors.secondary.dark} 80%, white);
  }
}
`;

    styleRef.current.textContent = css;
  }, [tokens]);

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
      ref={containerRef}
      className={`wd-preview-scope relative overflow-hidden rounded-2xl border border-line bg-card ${className}`}
      style={{ minHeight: "500px", maxHeight: "600px" }}
    >
      <div className="absolute inset-0 cover-overlay" />
      <div className="relative flex h-full flex-col">
        <header className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Preview</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">{designDraft.theme || "default"}</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4">
            <p className="font-accent text-2xl md:text-3xl text-white/90">{tagline}</p>
          </div>

          <div className="mb-6 flex flex-col items-center gap-2">
            <p className="font-heading text-4xl md:text-6xl lg:text-7xl font-light text-white">
              {groomName} <span className="font-accent">&</span> {brideName}
            </p>
            <p className="font-body text-lg md:text-xl text-white/80 max-w-md">
              {openingLine}
            </p>
          </div>

          <div className="mb-8 flex items-center justify-center gap-4 text-white/80">
            <span className="font-body">📅</span>
            <time className="font-body text-lg" dateTime={weddingDate}>
              {formattedDate}
            </time>
          </div>

          <div className="mt-auto mb-8 w-full max-w-xs">
            <button className="w-full rounded-full bg-white/10 px-6 py-3 text-white backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              Lihat Undangan
            </button>
          </div>
        </main>

        <footer className="px-4 py-3 text-center">
          <p className="text-xs text-white/50">
            Preview mode — tampilan final mungkin berbeda
          </p>
        </footer>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 pointer-events-none">
        <div className="flex gap-1" style={{ pointerEvents: "auto" }}>
          <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
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
    <div className="mt-3 rounded-xl border border-line bg-cream/50 p-4 max-h-96 overflow-auto">
      <h4 className="font-serif text-lg text-sapphire-deep mb-3">Design Tokens Aktif</h4>
      <pre className="text-xs font-mono bg-white/50 p-3 rounded-xl overflow-auto text-left max-h-80 text-neutral-900">
        {JSON.stringify(tokens, null, 2)}
      </pre>
    </div>
  );
}
