"use client";

import { useState, useEffect, useRef } from "react";
import type { PackSize } from "@/types";

export function usePackPanel() {
  const [activePanel, setActivePanel] = useState<PackSize | null>(null);
  const btn5Ref = useRef<HTMLButtonElement>(null);
  const btn10Ref = useRef<HTMLButtonElement>(null);

  function togglePanel(pack: PackSize) {
    setActivePanel((prev) => (prev === pack ? null : pack));
  }

  function closePanel() {
    setActivePanel(null);
  }

  // Global Escape handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePanel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { activePanel, togglePanel, closePanel, btn5Ref, btn10Ref };
}
