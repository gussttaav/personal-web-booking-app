import type { PackSize } from "@/types";

// ─── Packs ────────────────────────────────────────────────────────────────────

export const PACK_CONFIG: Record<
  PackSize,
  {
    size: PackSize;
    price: string;
    priceValue: number;
    perClass: string;
    savings: string;
    badge: string;
    featured?: boolean;
  }
> = {
  5: {
    size: 5,
    price: "€75",
    priceValue: 75,
    perClass: "€15/clase",
    savings: "Ahorras €5 vs sesiones sueltas",
    badge: "⚡ Popular",
    featured: true,
  },
  10: {
    size: 10,
    price: "€140",
    priceValue: 140,
    perClass: "€14/clase",
    savings: "Ahorras €20 vs sesiones sueltas",
    badge: "Máximo ahorro",
    featured: false,
  },
};

export const PACK_SIZES = [5, 10] as const satisfies readonly PackSize[];

export const PACK_VALIDITY_MONTHS = 6;

// ─── Polling ──────────────────────────────────────────────────────────────────

export const CREDITS_POLL_INTERVAL_MS = 1000;
export const CREDITS_POLL_MAX_ATTEMPTS = 20;

// ─── Cal.com event slugs ──────────────────────────────────────────────────────

/** Cal.com event links (full URL form → stripped to "username/slug" by getCalLink) */
export const CAL_EVENTS = {
  /** 15-min free intro */
  free15min: "gustavo-torres/15min",
  /** 1-hour session */
  session1h: "gustavo-torres/reunion-de-1-hora",
  /** 2-hour session */
  session2h: "gustavo-torres/reunion-de-2-horas",
  /** Pack booking event (used when student has credits) */
  packBooking:
    (process.env.NEXT_PUBLIC_CAL_EVENT_SLUG as string | undefined) ??
    "gustavo-torres/reunion-de-1-hora",
} as const;

// ─── Design tokens (kept in sync with globals.css) ───────────────────────────

export const COLORS = {
  brand: "#3ddc84",
  brandHover: "#34c274",
  brandMuted: "rgba(61,220,132,0.12)",
  brandBorder: "rgba(61,220,132,0.2)",
  surface: "#141618",
  background: "#0d0f10",
  border: "rgba(255,255,255,0.07)",
  textPrimary: "#e8e9ea",
  textSecondary: "#7a7f84",
  textMuted: "#4a4f54",
  textBody: "#c9d1de",
  error: "#f87171",
  errorBg: "rgba(248,113,113,0.08)",
  errorBorder: "rgba(248,113,113,0.27)",
  warning: "#fbbf24",
  warningBg: "rgba(251,191,36,0.08)",
  warningBorder: "rgba(251,191,36,0.2)",
  successBg: "rgba(13,31,20,0.9)",
  successBorder: "rgba(61,220,132,0.27)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strips "https://cal.com/" prefix so the embed only receives "username/slug" */
export function getCalLink(url?: string): string {
  return (url || "https://cal.com/gustavo-torres").replace(
    "https://cal.com/",
    ""
  );
}
