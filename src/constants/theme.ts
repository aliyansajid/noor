/**
 * Noor design system — the single source of truth for color, type, spacing and elevation.
 *
 * Brand: emerald + gold + ivory. Restrained and premium. Dark mode is the default
 * (spiritual / night-reading feel). Never hardcode hex in components — read from here.
 */

import { Platform } from 'react-native';

/* ------------------------------------------------------------------ *
 * Raw palette — the brand ramp. Components should prefer the semantic
 * `Colors` map below; use Palette only when a raw value is truly needed.
 * ------------------------------------------------------------------ */
export const Palette = {
  // Emerald
  emerald: '#3FA985',
  emeraldDeep: '#1B6B52',
  emeraldDark: '#0F4034',
  // Gold
  gold: '#E3C46B',
  goldMuted: '#C9A24B',
  // Ivory / neutrals
  ivory: '#FAF7F0',
  cream: '#F3EEE3',
  ink: '#1A1A17',
  // Dark canvas
  night: '#0E1512',
  nightSurface: '#16211C',
  nightElevated: '#1E2B24',
  // Fixed
  white: '#FFFFFF',
  black: '#000000',
  // Status
  danger: '#E5675A',
  success: '#4CAF8F',
} as const;

/* ------------------------------------------------------------------ *
 * Semantic colors, per scheme. This is what components consume.
 * ------------------------------------------------------------------ */
export const Colors = {
  light: {
    text: Palette.ink,
    textSecondary: '#5C5F58',
    textMuted: '#8A8D85',
    textOnPrimary: Palette.white,

    background: Palette.ivory,
    surface: Palette.white,
    surfaceElevated: Palette.white,
    surfaceSelected: Palette.cream,

    primary: Palette.emeraldDeep,
    primarySoft: '#E3EFE9',
    accent: Palette.goldMuted,

    border: '#E6E0D4',
    borderStrong: '#D6CFC0',

    danger: Palette.danger,
    success: Palette.success,
  },
  dark: {
    text: '#EDE9DF',
    textSecondary: '#A7B0A9',
    textMuted: '#8A968F',
    textOnPrimary: '#06120D',

    background: Palette.night,
    surface: Palette.nightSurface,
    surfaceElevated: Palette.nightElevated,
    surfaceSelected: '#26332B',

    primary: Palette.emerald,
    primarySoft: '#173028',
    accent: Palette.gold,

    border: '#26332B',
    borderStrong: '#31423A',

    danger: Palette.danger,
    success: Palette.success,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorScheme = keyof typeof Colors;

/* ------------------------------------------------------------------ *
 * Font families. Names must match the keys registered in useAppFonts().
 * Falls back to system fonts until the custom fonts load.
 * ------------------------------------------------------------------ */
export const FontFamily = {
  // UI / body — Plus Jakarta Sans
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  // Editorial serif — Fraunces (titles, daily verse)
  serif: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
  // Arabic ayahs — Amiri (Naskh). Swap for KFGQPC Uthmanic Hafs when the file is added.
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
} as const;

/* ------------------------------------------------------------------ *
 * Type scale — presets consumed by <ThemedText type="...">.
 * ------------------------------------------------------------------ */
export const Typography = {
  display: { fontFamily: FontFamily.serifBold, fontSize: 40, lineHeight: 46 },
  title: { fontFamily: FontFamily.serif, fontSize: 30, lineHeight: 38 },
  heading: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28 },
  subtitle: { fontFamily: FontFamily.semibold, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 25 },
  bodyMedium: { fontFamily: FontFamily.medium, fontSize: 16, lineHeight: 25 },
  label: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: FontFamily.semibold, fontSize: 16, lineHeight: 20 },
  // Arabic ayah display — large, generous line height for diacritics
  ayah: { fontFamily: FontFamily.arabic, fontSize: 28, lineHeight: 52 },
} as const;

export type TypographyVariant = keyof typeof Typography;

/* ------------------------------------------------------------------ *
 * Spacing — 4pt base scale.
 * ------------------------------------------------------------------ */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/* ------------------------------------------------------------------ *
 * Corner radii.
 * ------------------------------------------------------------------ */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/* ------------------------------------------------------------------ *
 * Elevation presets. Use with the current surface color.
 * ------------------------------------------------------------------ */
export const Shadows = {
  none: {},
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const Layout = {
  screenPadding: Spacing.xl,
  maxContentWidth: 720,
  bottomTabInset: Platform.select({ ios: 50, android: 80 }) ?? 0,
} as const;
