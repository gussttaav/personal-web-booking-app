/**
 * /sesion/[token] — Zoom session room
 *
 * Server component. Uses the cancellation/booking token to look up the
 * booking record and render ZoomRoom for the authenticated student.
 *
 * Access control: if the token is invalid or already used the visitor is
 * redirected to the homepage. The ZoomRoom component makes a subsequent
 * fetch to /api/zoom/token which independently verifies authentication.
 */

import { redirect } from "next/navigation";
import { toZonedTime, format } from "date-fns-tz";
import { verifyCancellationToken } from "@/lib/calendar";
import ZoomRoom from "@/components/ZoomRoom";

const SESSION_LABELS: Record<string, string> = {
  free15min: "Encuentro inicial gratuito · 15 min",
  session1h: "Sesión individual · 1 hora",
  session2h: "Sesión individual · 2 horas",
  pack:      "Clase de pack",
};

const TZ = "Europe/Madrid";

function formatSessionTime(iso: string): string {
  const zoned = toZonedTime(new Date(iso), TZ);
  return format(zoned, "d 'de' MMMM, HH:mm", { timeZone: TZ });
}

export default async function SesionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await verifyCancellationToken(token);
  if (!result) {
    redirect("/");
  }

  const { record } = result;
  const sessionLabel = SESSION_LABELS[record.sessionType] ?? record.sessionType;
  const timeLabel    = formatSessionTime(record.startsAt);

  return (
    <main
      className="flex flex-col h-screen"
      style={{ background: "#0d0f10" }}
    >
      {/* ── Session info bar ── */}
      <header
        className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: "#e5e1e4" }}>
            {sessionLabel}
          </p>
          <p className="text-xs" style={{ color: "#86948a" }}>
            {timeLabel} (hora de Madrid)
          </p>
        </div>
        <a
          href="/"
          className="text-xs"
          style={{ color: "#4edea3", textDecoration: "none" }}
        >
          gustavoai.dev
        </a>
      </header>

      {/* ── Video room ── */}
      <div className="flex-1 min-h-0">
        <ZoomRoom eventId={record.eventId} userName={record.name} />
      </div>
    </main>
  );
}
