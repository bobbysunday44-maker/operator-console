import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── OpenClaw Design System Colors ──
      colors: {
        oc: {
          bg: "#F8F7F4",
          card: "#FFFFFF",
          border: "#E8E5DE",
          "border-light": "#F0EDE6",
          text: "#1A1A1A",
          "text-secondary": "#6B6560",
          "text-muted": "#9C9590",
          blue: "#2563EB",
          "blue-light": "#EFF4FF",
          "blue-soft": "#DBEAFE",
          green: "#059669",
          "green-light": "#ECFDF5",
          amber: "#D97706",
          "amber-light": "#FFFBEB",
          red: "#DC2626",
          "red-light": "#FEF2F2",
          purple: "#7C3AED",
          "purple-light": "#F5F3FF",
          teal: "#0D9488",
          "teal-light": "#F0FDFA",
          pink: "#DB2777",
          "pink-light": "#FDF2F8",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      // ── Typography ──
      fontFamily: {
        sans: ["var(--font-dm-sans)", "'DM Sans'", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "'JetBrains Mono'", "'SF Mono'", "monospace"],
      },
      fontSize: {
        "page-title": ["22px", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        "section-title": ["15px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        "card-label": ["11px", { lineHeight: "1", letterSpacing: "0.06em", fontWeight: "500" }],
        "kpi-value": ["26px", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        "small": ["12px", { lineHeight: "1.4" }],
        "tiny": ["10px", { lineHeight: "1.2" }],
        "mono-data": ["11px", { lineHeight: "1.3" }],
      },
      // ── Spacing & Radius ──
      borderRadius: {
        "oc": "12px",
        "oc-sm": "8px",
        "oc-pill": "20px",
      },
      // ── Transitions ──
      transitionDuration: {
        "hover": "150ms",
        "progress": "600ms",
      },
      // ── Widths ──
      width: {
        "sidebar": "210px",
        "studio-left": "340px",
        "studio-right": "240px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
