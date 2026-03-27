/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Emerald Nocturne Palette ── */
        "primary":                  "#4edea3",
        "primary-container":        "#10b981",
        "on-primary":               "#003824",
        "on-primary-fixed":         "#002113",
        "on-primary-fixed-variant": "#005236",
        "primary-fixed":            "#6ffbbe",
        "primary-fixed-dim":        "#4edea3",

        "secondary":                "#9ed2b5",
        "secondary-container":      "#21523c",
        "on-secondary":             "#013824",
        "on-secondary-container":   "#91c4a8",
        "secondary-fixed":          "#baeed1",
        "secondary-fixed-dim":      "#9ed2b5",
        "on-secondary-fixed":       "#002113",
        "on-secondary-fixed-variant": "#1e4f3a",

        "tertiary":                 "#ffb3af",
        "tertiary-container":       "#fc7c78",
        "on-tertiary":              "#650911",
        "on-tertiary-container":    "#711419",
        "tertiary-fixed":           "#ffdad7",
        "tertiary-fixed-dim":       "#ffb3af",
        "on-tertiary-fixed":        "#410005",
        "on-tertiary-fixed-variant": "#842225",

        "error":                    "#ffb4ab",
        "error-container":          "#93000a",
        "on-error":                 "#690005",
        "on-error-container":       "#ffdad6",

        /* ── Surface ── */
        "background":               "#131315",
        "surface":                  "#131315",
        "surface-dim":              "#131315",
        "surface-bright":           "#39393b",
        "surface-variant":          "#353437",
        "surface-container-lowest": "#0e0e10",
        "surface-container-low":    "#1c1b1d",
        "surface-container":        "#201f22",
        "surface-container-high":   "#2a2a2c",
        "surface-container-highest":"#353437",
        "surface-tint":             "#4edea3",
        "inverse-surface":          "#e5e1e4",
        "inverse-on-surface":       "#313032",
        "inverse-primary":          "#006c49",

        /* ── On-surface text ── */
        "on-surface":               "#e5e1e4",
        "on-surface-variant":       "#bbcabf",
        "on-background":            "#e5e1e4",

        /* ── Outline ── */
        "outline":                  "#86948a",
        "outline-variant":          "#3c4a42",
      },

      fontFamily: {
        "headline": ["var(--font-headline)", "Manrope", "sans-serif"],
        "body":     ["var(--font-body)", "Inter", "sans-serif"],
        "label":    ["var(--font-body)", "Inter", "sans-serif"],
      },

      borderRadius: {
        "DEFAULT": "0.125rem",  /* 2px — sharp for data elements */
        "sm":      "0.25rem",   /* 4px */
        "md":      "0.375rem",  /* 6px — buttons */
        "lg":      "0.5rem",    /* 8px */
        "xl":      "0.75rem",   /* 12px — cards */
        "2xl":     "1rem",      /* 16px — large containers */
        "full":    "9999px",    /* pill */
      },

      boxShadow: {
        /* Emerald Nocturne ambient shadow */
        "elevation-sm":  "0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
        "elevation-md":  "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
        "elevation-lg":  "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        "glow-primary":  "0 0 30px rgba(78,222,163,0.4)",
        "glow-primary-lg": "0 20px 60px -15px rgba(78,222,163,0.5)",
      },

      animation: {
        "fadeUp": "fadeUp 0.6s ease both",
        "fadeIn": "fadeIn 0.4s ease both",
        "skeleton": "skeletonPulse 1.4s ease-in-out infinite",
      },

      keyframes: {
        fadeUp: {
          "from": { opacity: "0", transform: "translateY(20px)" },
          "to":   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "from": { opacity: "0" },
          "to":   { opacity: "1" },
        },
        skeletonPulse: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.45" },
        },
      },
    },
  },
  plugins: [],
};
