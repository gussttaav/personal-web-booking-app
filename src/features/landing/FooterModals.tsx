"use client";

/**
 * FooterModals — client island for the last 3 columns of the footer grid.
 *
 * Renders:
 *   • Col 2 — Políticas: buttons that open policy modals
 *   • Col 3 — Ayuda: email link + AI assistant trigger
 *   • Col 4 — Cancelaciones: at-a-glance policy summary
 *   • The three modals themselves (portaled via fixed overlay)
 *
 * Communicates with Chat.tsx via a custom DOM event ("open-chat")
 * so no prop drilling is needed across the RSC boundary.
 */

import { useState, useEffect, useCallback } from "react";

type ModalId = "cancelacion" | "terminos" | "privacidad" | null;

// ─── Modal content ────────────────────────────────────────────────────────────

function CancelacionContent() {
  return (
    <>
      <p>Puedes cancelar o reprogramar cualquier clase con al menos <strong>2 horas de antelación</strong> sin ningún coste.</p>
      <h3>Clases de pack</h3>
      <p>Si cancelas con suficiente antelación, el crédito se devuelve automáticamente a tu pack y queda disponible para reservar otra clase. Los créditos no caducan de forma anticipada por cancelar — simplemente vuelven a tu saldo.</p>
      <h3>Sesiones individuales pagadas</h3>
      <p>Si cancelas con al menos 2 horas de antelación, Gustavo tramitará el reembolso manualmente en un plazo de 1–3 días hábiles. Si la cancelación es con menos de 2 horas de antelación o no se presenta sin aviso previo, no se realizará reembolso.</p>
      <h3>Validez de los packs</h3>
      <p>Los packs tienen una validez de <strong>6 meses</strong> desde la fecha de compra. Los créditos no consumidos dentro de ese plazo caducan. Las cancelaciones dentro del período de validez siempre devuelven el crédito.</p>
      <h3>Encuentro inicial gratuito</h3>
      <p>El encuentro de 15 minutos es gratuito y se puede cancelar o reprogramar sin límite de tiempo previo.</p>
      <h3>Cómo cancelar</h3>
      <p>Usa el enlace de cancelación del email de confirmación de Cal.com, o escribe a <a href="mailto:contacto@gustavoai.dev">contacto@gustavoai.dev</a>.</p>
    </>
  );
}

function TerminosContent() {
  return (
    <>
      <p>Al reservar una sesión o adquirir un pack en este sitio, aceptas las condiciones que se describen a continuación.</p>
      <h3>Servicio</h3>
      <p>Gustavo Torres Guerrero ofrece clases particulares y consultoría en línea. Las sesiones se realizan por <strong>Google Meet</strong> u otra plataforma acordada.</p>
      <h3>Pagos</h3>
      <p>Los pagos se procesan de forma segura a través de <strong>Stripe</strong>. No se almacenan datos de tarjetas. Al pagar aceptas también los <a href="https://stripe.com/es/legal" target="_blank" rel="noopener noreferrer">términos de Stripe</a>.</p>
      <h3>Packs de clases</h3>
      <p>Los packs son de uso personal e intransferibles. Validez de 6 meses desde la compra. Los créditos no utilizados al vencimiento caducan sin derecho a reembolso.</p>
      <h3>Cancelaciones y reembolsos</h3>
      <p>Ver la <strong>Política de cancelación</strong> para los detalles completos.</p>
      <h3>Responsabilidad</h3>
      <p>Las clases están orientadas a la formación y apoyo académico. No se garantizan resultados académicos específicos.</p>
      <h3>Contacto</h3>
      <p>Dudas sobre estos términos: <a href="mailto:contacto@gustavoai.dev">contacto@gustavoai.dev</a>.</p>
    </>
  );
}

function PrivacidadContent() {
  return (
    <>
      <p>Tu privacidad es importante. Esta política explica qué datos se recogen y cómo se usan.</p>
      <h3>Datos que se recogen</h3>
      <ul>
        <li><strong>Nombre y email</strong> — al iniciar sesión con Google o al realizar una compra, para gestionar tu cuenta y tus reservas.</li>
        <li><strong>Datos de pago</strong> — gestionados exclusivamente por Stripe. Nunca se almacenan datos de tarjeta.</li>
        <li><strong>Créditos y reservas</strong> — el saldo de clases compradas se guarda en una base de datos segura asociada a tu email.</li>
      </ul>
      <h3>Cómo se usan</h3>
      <ul>
        <li>Para gestionar tu acceso, reservas y saldo de clases.</li>
        <li>Para enviarte confirmaciones y recordatorios de clase (vía Cal.com).</li>
        <li>No se venden datos a terceros ni se usan con fines publicitarios.</li>
      </ul>
      <h3>Servicios de terceros</h3>
      <ul>
        <li><strong>Google OAuth</strong> — inicio de sesión. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de Google</a>.</li>
        <li><strong>Stripe</strong> — pagos. <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener noreferrer">Política de Stripe</a>.</li>
        <li><strong>Cal.com</strong> — gestión de reservas y recordatorios.</li>
        <li><strong>Upstash Redis</strong> — almacenamiento del saldo de créditos.</li>
      </ul>
      <h3>Tus derechos</h3>
      <p>Puedes solicitar la eliminación de tus datos escribiendo a <a href="mailto:contacto@gustavoai.dev">contacto@gustavoai.dev</a>.</p>
      <h3>Cookies</h3>
      <p>Solo se usan cookies estrictamente necesarias para la autenticación (NextAuth). Sin cookies de seguimiento ni publicidad.</p>
    </>
  );
}

const MODAL_META: Record<Exclude<ModalId, null>, { title: string; Content: () => React.JSX.Element }> = {
  cancelacion: { title: "Política de cancelación", Content: CancelacionContent },
  terminos:    { title: "Términos de servicio",     Content: TerminosContent },
  privacidad:  { title: "Política de privacidad",   Content: PrivacidadContent },
};

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ id, onClose }: { id: Exclude<ModalId, null>; onClose: () => void }) {
  const { title, Content } = MODAL_META[id];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        width: "100%", maxWidth: 560, maxHeight: "85dvh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: "var(--font-serif), 'DM Serif Display', serif",
            fontSize: 20, fontWeight: 400, color: "var(--text)",
          }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: 4,
              display: "flex", borderRadius: 6, transition: "color 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-prose" style={{
          padding: "20px 24px 24px", overflowY: "auto",
          fontSize: 14, lineHeight: 1.75, color: "var(--text-muted)",
        }}>
          <Content />
        </div>
      </div>

      <style>{`
        .modal-prose h3 { font-size:12px; font-weight:500; letter-spacing:0.07em; text-transform:uppercase; color:var(--text-dim); margin:20px 0 8px; }
        .modal-prose p  { margin-bottom:10px; }
        .modal-prose ul { padding-left:18px; margin-bottom:10px; }
        .modal-prose li { margin-bottom:5px; }
        .modal-prose strong { color:var(--text); font-weight:500; }
        .modal-prose a  { color:var(--green); text-decoration:none; }
        .modal-prose a:hover { text-decoration:underline; }
      `}</style>
    </div>
  );
}

// ─── Main export — renders footer columns 2, 3, 4 ────────────────────────────

export default function FooterModals() {
  const [openModal, setOpenModal] = useState<ModalId>(null);
  const close = useCallback(() => setOpenModal(null), []);

  function openChat() {
    window.dispatchEvent(new Event("open-chat"));
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  return (
    <>
      {/* ── Col 2: Políticas ── */}
      <div>
        <p className="footer-col-label">Políticas</p>
        <button className="footer-link" onClick={() => setOpenModal("cancelacion")}>Política de cancelación</button>
        <button className="footer-link" onClick={() => setOpenModal("terminos")}>Términos de servicio</button>
        <button className="footer-link" onClick={() => setOpenModal("privacidad")}>Privacidad</button>
      </div>

      {/* ── Col 3: Ayuda ── */}
      <div>
        <p className="footer-col-label">Ayuda</p>
        <a className="footer-link" href="mailto:contacto@gustavoai.dev" style={{display:"flex",alignItems:"center",gap:6}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" style={{flexShrink:0}}>
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m2 7 10 7 10-7"/>
          </svg>
          contacto@gustavoai.dev
        </a>
        <button
          className="footer-link"
          onClick={openChat}
          style={{display:"flex",alignItems:"center",gap:6,marginTop:6}}
          title="Abre el asistente IA para responder tus preguntas al instante"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{flexShrink:0,color:"var(--green)"}}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Pregunta al asistente IA
        </button>
        <button
          onClick={openChat}
          style={{
            display:"inline-block",
            fontSize:11, color:"var(--green)",
            padding:"2px 8px",
            border:"1px solid rgba(61,220,132,0.25)",
            borderRadius:100,
            marginTop:5,
            marginLeft:19,
            background:"none",
            cursor:"pointer",
            fontFamily:"inherit",
            transition:"background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "rgba(61,220,132,0.08)";
            el.style.borderColor = "rgba(61,220,132,0.5)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "none";
            el.style.borderColor = "rgba(61,220,132,0.25)";
          }}
          title="Abrir el asistente IA"
        >
          FAQs al instante
        </button>
      </div>

      {/* ── Modals ── */}
      {openModal && <Modal id={openModal} onClose={close} />}

      <style>{`
        .footer-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          padding: 3px 0;
          line-height: 1.55;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: color 0.15s;
          width: 100%;
        }
        .footer-link:hover { color: var(--text); }
      `}</style>
    </>
  );
}
