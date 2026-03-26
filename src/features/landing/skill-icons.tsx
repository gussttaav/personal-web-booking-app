// src/features/landing/skill-icons.tsx

import type { ReactNode } from "react";
import { SKILL_ITEMS as RAW_ITEMS } from "@/constants/skills";

function CodeXmlIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* < and > brackets with slash */}
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
      <path d="m14 4-4 16" />
    </svg>
  );
}

function SigmaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}

function ChartScatterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="18.5" cy="14.5" r="2.5" />
      <circle cx="11.5" cy="18.5" r="2.5" />
      <circle cx="16.5" cy="4.5" r="2.5" />
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    </svg>
  );
}

function BrainIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Left hemisphere */}
      <path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3 3 3 0 0 0 2 3v1a3 3 0 0 0 3 3" />
      <path d="M9 4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3" />
      
      {/* Right hemisphere */}
      <path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 3 3 3 0 0 1-2 3v1a3 3 0 0 1-3 3" />
      <path d="M15 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3" />
      
      {/* Inner folds */}
      <path d="M9 8h.01" />
      <path d="M15 8h.01" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
    </svg>
  );
}

function GraduationCapIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
      <path d="M12 17v-4" />
    </svg>
  );
}

function SpringBootIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.205 16.392c-2.469 3.289-7.741 2.179-11.122 2.338 0 0-.599.034-1.201.133 0 0 .228-.097.519-.198 2.374-.821 3.496-.986 4.939-1.727 2.71-1.388 5.408-4.413 5.957-7.555-1.032 3.022-4.17 5.623-7.027 6.679-1.955.722-5.492 1.424-5.493 1.424a5.28 5.28 0 0 1-.143-.076c-2.405-1.17-2.475-6.38 1.894-8.059 1.916-.736 3.747-.332 5.818-.825 2.208-.525 4.766-2.18 5.805-4.344 1.165 3.458 2.565 8.866.054 12.21zm.042-13.28a9.212 9.212 0 0 1-1.065 1.89 9.982 9.982 0 0 0-7.167-3.031C6.492 1.971 2 6.463 2 11.985a9.983 9.983 0 0 0 3.205 7.334l.22.194a.856.856 0 1 1 .001.001l.149.132A9.96 9.96 0 0 0 12.015 22c5.278 0 9.613-4.108 9.984-9.292.274-2.539-.476-5.763-1.752-9.596" />
    </svg>
  );
}

// ─── Map skills to their icons ────────────────────────────────────────────────

// Order matches SKILL_ITEMS in constants/skills.ts:
// 0: Programación con Python, Java, C y Haskell
// 1: Desarrollo backend con Spring Boot
// 2: Análisis de datos & Estadística
// 3: Matemáticas Computacionales
// 4: Ciclos formativos DAM y DAW
// 5: Inteligencia Artificial

function getIcon(index: number, size = 16): ReactNode {
  switch (index) {
    case 0:
      return <CodeXmlIcon size={size} />;           // programación
    case 1:
      return <SpringBootIcon size={size} />;        // backend Spring Boot
    case 2:
      return <ChartScatterIcon size={size} />;      // análisis de datos
    case 3:
      return <SigmaIcon size={size} />;             // matemática computacional
    case 4:
      return <GraduationCapIcon size={size} />;     // ciclos formativos
    case 5:
      return <BrainIcon size={size} />;             // inteligencia artificial
    default:
      return null;
  }
}

export const SKILL_ITEMS_DATA = RAW_ITEMS.map((item, i) => ({
  ...item,
  icon: getIcon(i, 16),
}));
