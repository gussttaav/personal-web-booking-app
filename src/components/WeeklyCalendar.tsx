"use client";

/**
 * WeeklyCalendar — Emerald Nocturne reskin
 *
 * ALL LOGIC IS IDENTICAL TO ORIGINAL.
 * Only changes: inline style color values updated to Emerald Nocturne palette.
 *
 * Token mapping:
 *   var(--green)         → #4edea3
 *   var(--surface)       → #201f22   (surface-container)
 *   var(--border)        → rgba(255,255,255,0.05)
 *   var(--text)          → #e5e1e4
 *   var(--text-muted)    → #bbcabf
 *   var(--text-dim)      → #86948a
 *   slot selected bg     → #4edea3
 *   slot selected color  → #003824   (on-primary)
 *
 * Day column headers, navigation buttons, slot buttons, and the confirm modal
 * all use the new tokens. CSS variables still work for backward compat.
 *
 * NOTE: This file imports and re-exports SelectedSlot type — unchanged.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { SCHEDULE, DAY_SCHEDULES } from "@/lib/booking-config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiSlot {
  start:      string;
  end:        string;
  label:      string;
  localLabel: string;
}

export interface SelectedSlot {
  startIso:  string;
  endIso:    string;
  label:     string;
  dateLabel: string;
  note?:     string;
  timezone?: string;
}

interface WeeklyCalendarProps {
  durationMinutes: 15 | 60 | 120;
  onSlotSelected:  (slot: SelectedSlot) => void;
  selectedSlot?:   SelectedSlot | null;
}

type DaySlots = ApiSlot[] | "loading" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart(offset = 0): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7);
  return monday;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function slotKey(date: Date, slot: ApiSlot): string {
  return `${formatDateKey(date)}-${slot.start}`;
}

const DAY_ABBR = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeeklyCalendar({
  durationMinutes,
  onSlotSelected,
  selectedSlot,
}: WeeklyCalendarProps) {
  const [weekOffset, setWeekOffset]   = useState(0);
  const [slotsMap,   setSlotsMap]     = useState<Record<string, DaySlots>>({});
  const [focusedKey, setFocusedKey]   = useState<string | null>(null);
  const [modalSlot,  setModalSlot]    = useState<{ slot: ApiSlot; date: Date } | null>(null);
  const [isMobile,   setIsMobile]     = useState(false);
  const [userTz,     setUserTz]       = useState<string>(SCHEDULE.timezone);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxWeekOffset = SCHEDULE.bookingWindowWeeks - 1;
  const weekStart     = getWeekStart(weekOffset);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 500);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Detect user timezone
  useEffect(() => {
    try {
      setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch { /* ignore */ }
  }, []);

  // Build 7-day window
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // Fetch slots for each day in the window
  useEffect(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + SCHEDULE.bookingWindowWeeks * 7);

    days.forEach((date) => {
      const key = formatDateKey(date);
      if (slotsMap[key]) return; // already fetched or loading

      const isPast   = date < today;
      const isBeyond = date > maxDate;
      const dow      = date.getDay();
      const noSched  = DAY_SCHEDULES[dow] === null;

      if (isPast || isBeyond || noSched) return;

      setSlotsMap((prev) => ({ ...prev, [key]: "loading" }));

      const tz = encodeURIComponent(userTz);
      fetch(`/api/availability?date=${key}&duration=${durationMinutes}&tz=${tz}`)
        .then((r) => r.json())
        .then((data) => {
          setSlotsMap((prev) => ({
            ...prev,
            [key]: Array.isArray(data.slots) ? data.slots : "error",
          }));
        })
        .catch(() => {
          setSlotsMap((prev) => ({ ...prev, [key]: "error" }));
        });
    });
  }, [weekOffset, durationMinutes, userTz]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSlotClick = useCallback((date: Date, slot: ApiSlot) => {
    const key = slotKey(date, slot);
    if (isMobile) {
      if (focusedKey === key) {
        setModalSlot({ slot, date });
        setFocusedKey(null);
      } else {
        setFocusedKey(key);
      }
    } else {
      setFocusedKey(key);
    }
  }, [isMobile, focusedKey]);

  const handleSelectOverlay = useCallback((date: Date, slot: ApiSlot, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalSlot({ slot, date });
    setFocusedKey(null);
  }, []);

  const handleModalConfirm = useCallback((note?: string) => {
    if (!modalSlot) return;
    const { slot, date } = modalSlot;
    const tzDiffers = userTz !== SCHEDULE.timezone;
    const displayLabel = tzDiffers ? slot.localLabel : slot.label;
    onSlotSelected({
      startIso:  slot.start,
      endIso:    slot.end,
      label:     displayLabel,
      dateLabel: formatDateLabel(date),
      note,
      timezone:  userTz,
    });
    setModalSlot(null);
  }, [modalSlot, userTz, onSlotSelected]);

  const handleModalClose = useCallback(() => setModalSlot(null), []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + SCHEDULE.bookingWindowWeeks * 7);
  const tzDiffers = userTz !== SCHEDULE.timezone;

  // Week label
  const weekLabel = (() => {
    const end = new Date(weekStart); end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    return `${fmt(weekStart)} — ${fmt(end)}`;
  })();

  return (
    <>
      <div ref={containerRef}>
        {/* ── Header row ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e5e1e4", fontFamily: "var(--font-headline, Manrope), sans-serif" }}>
              {weekLabel}
            </div>
            {tzDiffers && (
              <div style={{ fontSize: 11, color: "#86948a", marginTop: 2 }}>
                Horarios en tu zona ({userTz})
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <NavBtn onClick={() => setWeekOffset((w) => w - 1)} disabled={weekOffset === 0} direction="left" />
            <NavBtn onClick={() => setWeekOffset((w) => w + 1)} disabled={weekOffset >= maxWeekOffset} direction="right" />
          </div>
        </div>

        {/* ── Day grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${days.length}, 1fr)`, gap: 4 }}>
          {days.map((date) => {
            const key      = formatDateKey(date);
            const dow      = date.getDay();
            const daySlots = slotsMap[key];
            const isPast   = date < today;
            const isBeyond = date > maxDate;
            const noSched  = DAY_SCHEDULES[dow] === null;
            const isToday  = date.toDateString() === today.toDateString();

            return (
              <div key={key} style={{ minWidth: 0 }}>
                {/* Day header */}
                <div
                  style={{
                    textAlign: "center",
                    padding: "8px 4px",
                    marginBottom: 6,
                    borderRadius: 6,
                    background: isToday ? "rgba(78,222,163,0.08)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: isToday ? "#4edea3" : "#86948a",
                      marginBottom: 3,
                    }}
                  >
                    {DAY_ABBR[dow]}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: isToday ? "#4edea3" : "#e5e1e4",
                      fontFamily: "var(--font-headline, Manrope), sans-serif",
                      lineHeight: 1,
                    }}
                  >
                    {date.getDate()}
                  </div>
                </div>

                {/* Slots */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                  {isPast || isBeyond || noSched ? <EmptyDash /> :
                   daySlots === "loading" || daySlots === undefined ? <LoadingDots /> :
                   daySlots === "error" || daySlots.length === 0 ? <EmptyDash /> :
                   daySlots.map((slot) => {
                     const sk         = slotKey(date, slot);
                     const isFocused  = focusedKey === sk;
                     const isSelected = selectedSlot?.startIso === slot.start;
                     const displayLabel = tzDiffers ? slot.localLabel : slot.label;
                     return (
                       <SlotButton
                         key={slot.start}
                         label={displayLabel}
                         subLabel={tzDiffers ? slot.label : undefined}
                         focused={isFocused}
                         selected={isSelected}
                         isMobile={isMobile}
                         onClick={() => handleSlotClick(date, slot)}
                         onSelectOverlay={(e) => handleSelectOverlay(date, slot, e)}
                       />
                     );
                   })
                  }
                </div>
              </div>
            );
          })}
        </div>

        {isMobile && focusedKey && (
          <p style={{ fontSize: 12, color: "#86948a", textAlign: "center", marginTop: 12 }}>
            Toca el horario seleccionado de nuevo para confirmar
          </p>
        )}
      </div>

      {/* Confirmation modal */}
      {modalSlot && (
        <ConfirmModal
          slot={modalSlot.slot}
          date={modalSlot.date}
          userTz={userTz}
          onConfirm={handleModalConfirm}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  slot, date, userTz, onConfirm, onClose,
}: {
  slot: ApiSlot; date: Date; userTz: string;
  onConfirm: (note?: string) => void; onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const tzDiffers   = userTz !== SCHEDULE.timezone;
  const dateLabel   = formatDateLabel(date);
  const localLabel  = slot.localLabel;
  const madridLabel = slot.label;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div style={{
        background: "rgba(53,52,55,0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderRadius: 16, width: "100%", maxWidth: 420,
        padding: "24px",
        display: "flex", flexDirection: "column", gap: 18,
        animation: "fadeUp 0.2s ease both",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(78,222,163,0.1)",
              border: "1px solid rgba(78,222,163,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4edea3" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e5e1e4" }}>{dateLabel}</div>
              <div style={{ fontSize: 13, color: "#bbcabf" }}>
                {tzDiffers ? `${localLabel} (tu hora)` : localLabel}
                {tzDiffers && <span style={{ color: "#86948a", marginLeft: 4 }}>· {madridLabel} Madrid</span>}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#bbcabf", padding: 4, borderRadius: 6 }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#e5e1e4")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#bbcabf")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Note input */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#bbcabf", display: "block", marginBottom: 6 }}>
            Motivo de la sesión <span style={{ color: "#86948a", fontWeight: 400 }}>(opcional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Ej: tengo dudas sobre recursividad en Java, preparación de entrevista técnica..."
            style={{
              width: "100%", padding: "10px 12px",
              background: "#201f22",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, color: "#e5e1e4",
              fontFamily: "inherit", fontSize: 13, lineHeight: 1.6,
              resize: "vertical", outline: "none",
              transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(78,222,163,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
          />
          <p style={{ fontSize: 11.5, color: "#86948a", marginTop: 5 }}>
            También puedes enviar los detalles por email después
          </p>
        </div>

        {/* Confirm button */}
        <button
          onClick={() => onConfirm(note || undefined)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "13px 20px",
            background: "linear-gradient(135deg, #4edea3, #10b981)",
            border: "none", borderRadius: 8,
            color: "#003824", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            transition: "opacity 0.15s, transform 0.1s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; (e.currentTarget as HTMLElement).style.transform = "scale(1.01)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Confirmar reserva
        </button>

        <p style={{ fontSize: 11.5, color: "#86948a", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, margin: 0 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Recibirás confirmación por correo
        </p>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ─── Slot button ─────────────────────────────────────────────────────────────

function SlotButton({ label, subLabel, focused, selected, isMobile, onClick, onSelectOverlay }: {
  label: string; subLabel?: string;
  focused: boolean; selected: boolean; isMobile: boolean;
  onClick: () => void;
  onSelectOverlay: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const showOverlay = focused && (hovered || isMobile);

  return (
    <div
      style={{ position: "relative", width: "100%" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        style={{
          width: "100%", padding: subLabel ? "4px 2px" : "7px 2px",
          borderRadius: 6, fontSize: 11, fontWeight: focused || selected ? 600 : 400,
          cursor: "pointer", textAlign: "center",
          border: selected ? "1px solid #4edea3" :
                  focused  ? "1px solid rgba(78,222,163,0.6)" :
                             "1px solid rgba(60,74,66,0.5)",
          background: selected ? "#4edea3" :
                      focused  ? "rgba(78,222,163,0.18)" :
                                 "rgba(78,222,163,0.06)",
          color: selected ? "#003824" : "#4edea3",
          fontFamily: "inherit", lineHeight: 1.3,
          transition: "background 0.15s, border-color 0.15s",
          boxShadow: selected ? "0 4px 16px rgba(78,222,163,0.3)" : "none",
        }}
      >
        {label}
        {subLabel && <div style={{ fontSize: 9, opacity: 0.6, lineHeight: 1.2 }}>{subLabel}</div>}
      </button>

      {focused && !selected && (
        <button
          onClick={onSelectOverlay}
          style={{
            position: "absolute", inset: 0,
            borderRadius: 6, border: "none",
            background: hovered ? "rgba(78,222,163,0.92)" : "rgba(78,222,163,0.0)",
            color: "#003824",
            fontSize: 10, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            transition: "background 0.18s, opacity 0.18s",
            opacity: hovered ? 1 : 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Seleccionar este horario"
        >
          ✓ Seleccionar
        </button>
      )}
    </div>
  );
}

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavBtn({ onClick, disabled, direction }: { onClick: () => void; disabled: boolean; direction: "left" | "right" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Semana anterior" : "Semana siguiente"}
      style={{
        width: 30, height: 30, borderRadius: "50%",
        background: "#201f22",
        border: "1px solid rgba(255,255,255,0.07)",
        cursor: disabled ? "not-allowed" : "pointer",
        color: "#bbcabf",
        fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.3 : 1,
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => { if (!disabled) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(78,222,163,0.3)"; (e.currentTarget as HTMLElement).style.color = "#4edea3"; } }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "#bbcabf"; }}
    >
      {direction === "left"
        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      }
    </button>
  );
}

function EmptyDash() {
  return (
    <div style={{
      width: "100%", height: 36, borderRadius: 6,
      background: "#1c1b1d",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: 14, height: 1, background: "#86948a", opacity: 0.3 }} />
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{
      width: "100%", height: 36, borderRadius: 6,
      background: "#1c1b1d",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
    }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 4, height: 4, borderRadius: "50%",
          background: "#86948a",
          animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}
