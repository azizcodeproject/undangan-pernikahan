export type ColorScale = {
  light: string;
  dark: string;
};

export type DesignColors = {
  primary: ColorScale;
  secondary: ColorScale;
  background: ColorScale;
  surface: ColorScale;
  text: ColorScale;
  border: ColorScale;
  accent: ColorScale;
  muted: ColorScale;
};

export type DesignFonts = {
  heading: string;
  body: string;
  arabic: string;
  accent: string;
};

export type DesignSpacing = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
};

export type DesignBorderRadius = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
};

export type DesignShadows = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
};

export type DesignTransitions = {
  fast: string;
  normal: string;
  slow: string;
};

export type DesignTokens = {
  colors: DesignColors;
  fonts: DesignFonts;
  spacing: DesignSpacing;
  borderRadius: DesignBorderRadius;
  shadows: DesignShadows;
  transitions: DesignTransitions;
};

export const defaultDesignTokens: DesignTokens = {
  colors: {
    primary: { light: '#059669', dark: '#10b981' },
    secondary: { light: '#0e7490', dark: '#14b8a6' },
    background: { light: '#fefce8', dark: '#0f172a' },
    surface: { light: '#ffffff', dark: '#1e293b' },
    text: { light: '#18181b', dark: '#f8fafc' },
    border: { light: '#e4e4e7', dark: '#334155' },
    accent: { light: '#d97706', dark: '#fbbf24' },
    muted: { light: '#71717a', dark: '#94a3b8' },
  },
  fonts: {
    heading: '"Playfair Display", "Cormorant Garamond", serif',
    body: '"Inter", "DM Sans", sans-serif',
    arabic: '"Amiri", "Scheherazade New", serif',
    accent: '"Great Vibes", "Dancing Script", cursive',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const presetThemes: Record<string, Partial<DesignTokens>> = {
  elegant: {
    colors: {
      primary: { light: '#1e3a5f', dark: '#2c5f8a' },
      secondary: { light: '#c9a84c', dark: '#d4b85e' },
      background: { light: '#faf8f5', dark: '#1a1a2e' },
      surface: { light: '#ffffff', dark: '#16213e' },
      text: { light: '#1a1a2e', dark: '#eaeaea' },
      border: { light: '#e8dfd4', dark: '#2a2a4a' },
      accent: { light: '#c9a84c', dark: '#d4b85e' },
      muted: { light: '#8a8a8a', dark: '#a0a0a0' },
    },
    fonts: {
      heading: '"Cormorant Garamond", "Playfair Display", serif',
      body: '"Libre Baskerville", "Inter", serif',
      arabic: '"Amiri", serif',
      accent: '"Great Vibes", cursive',
    },
    borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
  },
  romantic: {
    colors: {
      primary: { light: '#be185d', dark: '#f43f5e' },
      secondary: { light: '#db2777', dark: '#fda4af' },
      background: { light: '#fff1f2', dark: '#2d1b26' },
      surface: { light: '#ffffff', dark: '#3d1f2e' },
      text: { light: '#4c0519', dark: '#ffe4e6' },
      border: { light: '#fce7f3', dark: '#5c1a36' },
      accent: { light: '#f43f5e', dark: '#fda4af' },
      muted: { light: '#be185d', dark: '#fda4af' },
    },
    fonts: {
      heading: '"Dancing Script", "Great Vibes", cursive',
      body: '"Nunito", "Inter", sans-serif',
      arabic: '"Amiri", serif',
      accent: '"Parisienne", cursive',
    },
    borderRadius: { sm: '12px', md: '20px', lg: '28px', xl: '36px', full: '9999px' },
  },
  modern: {
    colors: {
      primary: { light: '#0f172a', dark: '#f8fafc' },
      secondary: { light: '#3b82f6', dark: '#60a5fa' },
      background: { light: '#ffffff', dark: '#020617' },
      surface: { light: '#f8fafc', dark: '#0f172a' },
      text: { light: '#0f172a', dark: '#f1f5f9' },
      border: { light: '#e2e8f0', dark: '#1e293b' },
      accent: { light: '#06b6d4', dark: '#22d3ee' },
      muted: { light: '#64748b', dark: '#94a3b8' },
    },
    fonts: {
      heading: '"Space Grotesk", "Inter", sans-serif',
      body: '"Inter", "DM Sans", sans-serif',
      arabic: '"Kufam", sans-serif',
      accent: '"Space Grotesk", sans-serif',
    },
    borderRadius: { sm: '0', md: '4px', lg: '8px', xl: '12px', full: '9999px' },
  },
  traditional: {
    colors: {
      primary: { light: '#7c2d12', dark: '#ea580c' },
      secondary: { light: '#92400e', dark: '#fbbf24' },
      background: { light: '#fffbeb', dark: '#1c1917' },
      surface: { light: '#fef3c7', dark: '#292524' },
      text: { light: '#431407', dark: '#fef3c7' },
      border: { light: '#fde68a', dark: '#44403c' },
      accent: { light: '#d97706', dark: '#fbbf24' },
      muted: { light: '#a16207', dark: '#d97706' },
    },
    fonts: {
      heading: '"Amiri", "Scheherazade New", serif',
      body: '"Amiri", "Noto Naskh Arabic", serif',
      arabic: '"Amiri", "Scheherazade New", serif',
      accent: '"Amiri", serif',
    },
    borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '20px', full: '9999px' },
  },
  minimal: {
    colors: {
      primary: { light: '#18181b', dark: '#fafafa' },
      secondary: { light: '#71717a', dark: '#a3a3a3' },
      background: { light: '#ffffff', dark: '#09090b' },
      surface: { light: '#fafafa', dark: '#18181b' },
      text: { light: '#18181b', dark: '#fafafa' },
      border: { light: '#e4e4e7', dark: '#27272a' },
      accent: { light: '#18181b', dark: '#fafafa' },
      muted: { light: '#a1a1aa', dark: '#71717a' },
    },
    fonts: {
      heading: '"Inter", "DM Sans", sans-serif',
      body: '"Inter", "DM Sans", sans-serif',
      arabic: '"Kufam", sans-serif',
      accent: '"Inter", sans-serif',
    },
    borderRadius: { sm: '0', md: '0', lg: '0', xl: '0', full: '9999px' },
  },
  nature: {
    colors: {
      primary: { light: '#166534', dark: '#4ade80' },
      secondary: { light: '#854d0e', dark: '#fde047' },
      background: { light: '#f0fdf4', dark: '#052e16' },
      surface: { light: '#ffffff', dark: '#0f1f11' },
      text: { light: '#14532d', dark: '#dcfce7' },
      border: { light: '#bbf7d0', dark: '#1a4d2a' },
      accent: { light: '#65a30d', dark: '#a3e635' },
      muted: { light: '#4d7c0f', dark: '#84cc16' },
    },
    fonts: {
      heading: '"Merriweather", "Playfair Display", serif',
      body: '"Source Serif Pro", "Inter", serif',
      arabic: '"Amiri", serif',
      accent: '"Merriweather", serif',
    },
    borderRadius: { sm: '8px', md: '16px', lg: '24px', xl: '32px', full: '9999px' },
  },
};

export function applyTheme(tokens: DesignTokens, themeName: keyof typeof presetThemes): DesignTokens {
  const theme = presetThemes[themeName];
  if (!theme) return tokens;

  return deepMerge(tokens, theme as DesignTokens);
}

export function applyCustomColors(tokens: DesignTokens, colors: Partial<DesignColors>): DesignTokens {
  return deepMerge(tokens, { colors: colors as DesignColors });
}

export function applyCustomFonts(tokens: DesignTokens, fonts: Partial<DesignFonts>): DesignTokens {
  return deepMerge(tokens, { fonts: fonts as DesignFonts });
}

export function applyCustomSpacing(tokens: DesignTokens, spacing: Partial<DesignSpacing>): DesignTokens {
  return deepMerge(tokens, { spacing: spacing as DesignSpacing });
}

export function applyCustomBorderRadius(tokens: DesignTokens, radius: Partial<DesignBorderRadius>): DesignTokens {
  return deepMerge(tokens, { borderRadius: radius as DesignBorderRadius });
}

export function applyCustomShadows(tokens: DesignTokens, shadows: Partial<DesignShadows>): DesignTokens {
  return deepMerge(tokens, { shadows: shadows as DesignShadows });
}

export function applyCustomTransitions(tokens: DesignTokens, transitions: Partial<DesignTransitions>): DesignTokens {
  return deepMerge(tokens, { transitions: transitions as DesignTransitions });
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key as keyof T];
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      (result as Record<string, unknown>)[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else if (sourceValue !== undefined) {
      (result as Record<string, unknown>)[key] = sourceValue;
    }
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && value.constructor === Object;
}

export function tokensToCSSVars(tokens: DesignTokens, prefix = 'wd'): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [colorName, scale] of Object.entries(tokens.colors)) {
    vars[`--${prefix}-color-${colorName}-light`] = scale.light;
    vars[`--${prefix}-color-${colorName}-dark`] = scale.dark;
  }

  for (const [fontName, fontValue] of Object.entries(tokens.fonts)) {
    vars[`--${prefix}-font-${fontName}`] = fontValue;
  }

  for (const [spaceName, spaceValue] of Object.entries(tokens.spacing)) {
    vars[`--${prefix}-spacing-${spaceName}`] = spaceValue;
  }

  for (const [radiusName, radiusValue] of Object.entries(tokens.borderRadius)) {
    vars[`--${prefix}-radius-${radiusName}`] = radiusValue;
  }

  for (const [shadowName, shadowValue] of Object.entries(tokens.shadows)) {
    vars[`--${prefix}-shadow-${shadowName}`] = shadowValue;
  }

  for (const [transitionName, transitionValue] of Object.entries(tokens.transitions)) {
    vars[`--${prefix}-transition-${transitionName}`] = transitionValue;
  }

  return vars;
}

export type ThemeName = keyof typeof presetThemes;
export type { DesignTokens as DesignTokensType };