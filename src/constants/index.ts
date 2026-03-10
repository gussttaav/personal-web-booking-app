import type { PackSize } from "@/types";

// ─── Packs ────────────────────────────────────────────────────────────────────

export const PACK_CONFIG: Record<
  PackSize,
  { size: PackSize; price: string; priceValue: number; perClass: string; savings: string; badge: string; featured?: boolean }
> = {
  5: {
    size: 5,
    price: "€75",
    priceValue: 75,
    perClass: "€15/clase",
    savings: "ahorra €5",
    badge: "Popular",
  },
  10: {
    size: 10,
    price: "€140",
    priceValue: 140,
    perClass: "€14/clase",
    savings: "ahorra €20",
    badge: "Mejor precio",
    featured: true,
  },
};

export const PACK_SIZES = [5, 10] as const satisfies readonly PackSize[];

export const PACK_VALIDITY_MONTHS = 6;

// ─── Polling ──────────────────────────────────────────────────────────────────

export const CREDITS_POLL_INTERVAL_MS = 1000;
export const CREDITS_POLL_MAX_ATTEMPTS = 20;

// ─── Design tokens (mirrors Tailwind config + CSS vars) ───────────────────────

export const COLORS = {
  brand: "#18d26e",
  brandHover: "#15b85e",
  brandMuted: "rgba(24,210,110,0.12)",
  brandBorder: "rgba(24,210,110,0.2)",
  surface: "#161b27",
  background: "#0f1117",
  border: "#1e2535",
  textPrimary: "#ffffff",
  textSecondary: "#8b95a8",
  textMuted: "#4b5563",
  textBody: "#c9d1de",
  error: "#f87171",
  errorBg: "rgba(248,113,113,0.08)",
  errorBorder: "rgba(248,113,113,0.27)",
  warning: "#fbbf24",
  warningBg: "rgba(251,191,36,0.08)",
  warningBorder: "rgba(251,191,36,0.2)",
  successBg: "rgba(13,31,20,0.9)",
  successBorder: "rgba(24,210,110,0.27)",
} as const;

// ─── Cal.com ──────────────────────────────────────────────────────────────────

export function getCalLink(url?: string): string {
  return (url || "https://cal.com/gustavo-torres").replace("https://cal.com/", "");
}
