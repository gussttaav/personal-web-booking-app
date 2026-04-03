"use client";

/**
 * BookingLayout — full-page overlay wrapper for booking flows
 *
 * Replaces FullScreenShell. Uses position:fixed overlay so no routing changes
 * are needed. Renders the actual Navbar and Footer for visual consistency with
 * the landing page (matches booking.html layout).
 */

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BookingLayoutProps {
  children: React.ReactNode;
}

export default function BookingLayout({ children }: BookingLayoutProps) {
  // Hide the document scrollbar while the overlay is mounted so only the
  // overlay's own scrollbar is visible (globals.css sets overflow-y:scroll
  // on <html>, which would otherwise show a second, non-functional scrollbar).
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflowY;
    html.style.overflowY = "hidden";
    return () => {
      html.style.overflowY = prev;
    };
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "#131315",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      <main
        style={{
          flex: 1,
          paddingTop: "128px",
          paddingBottom: "80px",
          paddingLeft: "24px",
          paddingRight: "24px",
          maxWidth: "1440px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}
