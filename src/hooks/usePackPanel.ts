"use client";

import { useState, useEffect, useRef } from "react";
import type { PackSize } from "@/types";

export function usePackPanel() {
  // Whether the speed dial is expanded
  const [dialOpen, setDialOpen] = useState(false);
  // Which pack detail panel is open (null = none)
  const [activePanel, setActivePanel] = useState<PackSize | null>(null);

  // One ref per pack item — used to anchor the detail popup
  const btn5Ref = useRef<HTMLButtonElement>(null);
  const btn10Ref = useRef<HTMLButtonElement>(null);

  function toggleDial() {
    setDialOpen((prev) => {
      // Close any open detail panel when collapsing the dial
      if (prev) setActivePanel(null);
      return !prev;
    });
  }

  function closeDial() {
    setDialOpen(false);
    setActivePanel(null);
  }

  function togglePanel(pack: PackSize) {
    setActivePanel((prev) => (prev === pack ? null : pack));
  }

  function closePanel() {
    setActivePanel(null);
  }

  // Close everything on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDial();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return {
    dialOpen,
    activePanel,
    toggleDial,
    closeDial,
    togglePanel,
    closePanel,
    btn5Ref,
    btn10Ref,
  };
}
