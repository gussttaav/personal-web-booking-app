"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Tracks whether the top-right corner of a card has scrolled above the
 * viewport. Returns:
 *   - `cardRef`   — attach to the card element
 *   - `isSticky`  — true once the card top has scrolled past the viewport
 *   - `fixedTop`  — px offset from viewport top to place the buttons
 *   - `fixedRight`— px offset from viewport right to place the buttons
 *                   (mirrors the card's right edge)
 */
export function useStickyButtons(topOffset = 16) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [fixedRight, setFixedRight] = useState(16);

  useEffect(() => {
    function update() {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      // Stick once the card's top edge scrolls above `topOffset`
      setIsSticky(rect.top < topOffset);
      // Keep buttons aligned to the card's right edge
      setFixedRight(window.innerWidth - rect.right + 12);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [topOffset]);

  return { cardRef, isSticky, fixedRight, fixedTop: topOffset };
}
