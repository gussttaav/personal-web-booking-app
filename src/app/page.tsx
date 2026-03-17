import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { COLORS } from "@/constants";
import HeroSection from "@/features/landing/HeroSection";
import TrustBar from "@/features/landing/TrustBar";
import InteractiveShell from "@/features/booking/InteractiveShell";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: COLORS.background, position: "relative", zIndex: 1 }}
        >
          <Spinner />
        </div>
      }
    >
      <main style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "0 24px 80px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* ── Static RSC sections (no JS shipped) ── */}
          <HeroSection />

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, var(--border), transparent)",
              margin: "8px 0 32px",
            }}
          />

          {/* ── Client island: all interactive booking/auth state ── */}
          <InteractiveShell />

          {/* ── Static RSC trust bar ── */}
          <TrustBar />
        </div>

        {/* CSS animations (scoped to landing) */}
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .badge-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 100px;
            font-size: 12.5px;
            font-weight: 400;
            color: var(--text-muted);
            text-decoration: none;
            transition: border-color 0.2s, color 0.2s;
            white-space: nowrap;
          }
          .badge-link:hover {
            border-color: rgba(255,255,255,0.2);
            color: var(--text);
          }
          .badge-link--green {
            background: var(--green-dim);
            border-color: rgba(61,220,132,0.2);
            color: var(--green);
            font-weight: 500;
          }
          .badge-link--green:hover {
            background: var(--green-mid);
            border-color: rgba(61,220,132,0.4);
          }
        `}</style>
      </main>
    </Suspense>
  );
}
