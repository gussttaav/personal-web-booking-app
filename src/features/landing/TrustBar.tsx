// Server Component — static layout + FooterModals client island.
// The "Políticas", "Ayuda", and "Cancelaciones" columns are rendered by
// FooterModals so they can open modals and dispatch the open-chat event.

import FooterModals from "./FooterModals";

export default function TrustBar() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem", marginTop: "2.5rem" }}>

      <div className="footer-grid">
        {/* Col 1 — Clases (static, RSC) */}
        <div>
          <p className="footer-col-label">Clases</p>
          <a className="footer-link" href="#sessions">Encuentro inicial gratuito</a>
          <a className="footer-link" href="#sessions">Sesiones individuales</a>
          <a className="footer-link" href="#packs">Packs con descuento</a>
        </div>

        {/* Cols 2–4 — interactive columns (client island) */}
        <FooterModals />
      </div>

      {/* Bottom strip — payment badges + copyright */}
      <div className="footer-bottom">
        <div className="footer-payment-row">
          <span className="footer-secure-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--green)" aria-hidden="true">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
            </svg>
            Pago seguro · Stripe
          </span>

          <span className="footer-card-chip" aria-label="Visa">
            <svg width="32" height="11" viewBox="0 0 50 17" aria-hidden="true">
              <text x="0" y="14" fontSize="16" fontWeight="800" fontFamily="Arial,sans-serif" fill="#1A1F71">VISA</text>
            </svg>
          </span>

          <span className="footer-card-chip" aria-label="Mastercard">
            <svg width="28" height="18" viewBox="0 0 38 24" aria-hidden="true">
              <circle cx="14" cy="12" r="8" fill="#EB001B"/>
              <circle cx="24" cy="12" r="8" fill="#F79E1B"/>
              <path d="M19 5.6a8 8 0 0 1 0 12.8A8 8 0 0 1 19 5.6z" fill="#FF5F00"/>
            </svg>
          </span>

          <span className="footer-card-chip" aria-label="American Express">
            <svg width="28" height="18" viewBox="0 0 38 24" aria-hidden="true">
              <rect width="38" height="24" rx="3" fill="#016FD0"/>
              <text x="4" y="17" fontSize="9" fontWeight="700" fontFamily="Arial,sans-serif" fill="white">AMEX</text>
            </svg>
          </span>
        </div>

        <p className="footer-legal">
          © {new Date().getFullYear()} Gustavo Torres Guerrero · Santander, España
        </p>
      </div>

      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 380px) {
          .footer-grid { grid-template-columns: 1fr; }
        }
        .footer-col-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 10px;
        }
        .footer-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          padding: 3px 0;
          line-height: 1.55;
          transition: color 0.15s;
        }
        .footer-link:hover { color: var(--text); }
        .footer-bottom {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem 0 0.5rem;
        }
        .footer-payment-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .footer-secure-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--text-muted);
          padding-right: 10px;
          border-right: 1px solid var(--border);
        }
        .footer-card-chip {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: rgba(255,255,255,0.03);
          line-height: 1;
        }
        .footer-legal {
          font-size: 11.5px;
          color: var(--text-dim);
        }
      `}</style>
    </footer>
  );
}
