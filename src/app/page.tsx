import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import HeroSection from "@/features/landing/HeroSection";
import BiographySection from "@/features/landing/BiographySection";
import TrustBar from "@/features/landing/TrustBar";
import InteractiveShell from "@/features/booking/InteractiveShell";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * page.tsx — Emerald Nocturne redesign
 *
 * Layout (top → bottom):
 *   Navbar          (fixed, sticky — client component, auth-aware)
 *   HeroSection     (RSC — static, no JS)
 *   BiographySection (RSC — new, Case B)
 *   ──── divider ────
 *   InteractiveShell (client boundary — all booking/auth state)
 *   TrustBar         (RSC — static)
 *   Footer           (RSC — includes FooterModals client island)
 *
 * The full-width Navbar and Footer live outside the centered content column.
 * The column max-width matches the original (680px) for the booking shell.
 */

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#131315", position: "relative", zIndex: 1 }}
        >
          <Spinner />
        </div>
      }
    >
      {/* Fixed nav — full width, sits above everything */}
      <Navbar />

      <main style={{ position: "relative", zIndex: 1 }}>
        {/* ── Centered content column ── */}
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            padding: "0 24px 80px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Static RSC sections */}
          <HeroSection />

          {/* Biography — Case B: integrated with new styling */}
          <BiographySection />

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
              margin: "8px 0 36px",
            }}
          />

          {/* Client island — all interactive booking/auth state */}
          <InteractiveShell />

          {/* Static trust bar */}
          <TrustBar />
        </div>

        {/* CSS animations scoped to landing */}
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `}</style>
      </main>

      {/* Full-width footer */}
      <Footer />
    </Suspense>
  );
}
