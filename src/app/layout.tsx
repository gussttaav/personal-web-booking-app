import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Reserva tus clases con Gustavo Torres",
  description:
    "Reserva una clase individual o adquiere un pack de clases con descuento.",
  robots: { index: false, follow: false }, // private booking page
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f1117",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body className={dmSans.className}>{children}</body>
    </html>
  );
}
