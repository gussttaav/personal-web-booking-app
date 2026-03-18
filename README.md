Personal tutoring platform for booking programming, mathematics and AI classes. Built as a production Next.js application with Stripe payments, Cal.com scheduling, Upstash Redis credits, Server-Sent Events, and an AI assistant powered by Gemini.

> **Live site:** [gustavoai.dev](https://gustavoai.dev)

---

## Overview

This is the full source code of my personal tutoring website. Students can book individual sessions or purchase class packs, manage their credits, and get instant answers from an AI assistant trained on my full profile and service details.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + CSS variables |
| Auth | NextAuth v5 (Google OAuth) |
| Payments | Stripe Checkout + Webhooks |
| Scheduling | Cal.com embed + Webhooks |
| Credits store | Upstash Redis (`@upstash/redis`) |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) |
| AI assistant | Google Gemini API |
| Email notifications | Resend |
| Deployment | Vercel |
| Testing | Jest |

---

## Features

- **Individual sessions** — 15-min free intro, 1h and 2h paid sessions booked via Cal.com
- **Class packs** — buy 5 or 10 classes at a discount; credits stored in Redis and decremented on each booking
- **Stripe integration** — secure checkout with webhook signature verification and idempotency (no double-credits on retries)
- **Real-time credit activation** — Server-Sent Events push credit confirmation to the browser after payment; no polling
- **Cal.com webhook** — cancellations automatically restore credits to the student's pack; single-session cancellations notify by email
- **AI assistant** — Gemini-powered chat widget trained on full service details, pricing, cancellation policy, and background; answerable to FAQs without user needing to email
- **Google OAuth** — sign-in required before booking; session used server-side on all API routes (no URL-param trust)
- **Rate limiting** — sliding window limits on chat, credits, and checkout endpoints
- **RSC architecture** — static landing sections (hero, skills, footer) ship zero JavaScript; only interactive booking/auth state is a client component

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                        # RSC root — composes static + client sections
│   ├── pago-exitoso/                   # Post-payment page (SSE credit confirmation)
│   ├── sesion-confirmada/              # Single session confirmation
│   ├── reserva-confirmada/             # Free session confirmation
│   └── api/
│       ├── auth/[...nextauth]/         # NextAuth route
│       ├── book/                       # POST — decrement 1 credit (auth-gated)
│       ├── chat/                       # POST — Gemini AI chat (rate-limited)
│       ├── credits/                    # GET  — read credit balance (auth-gated)
│       ├── sse/                        # GET  — SSE stream for credit confirmation
│       ├── cal/webhook/                # POST — Cal.com booking events
│       └── stripe/
│           ├── checkout/               # POST — create Stripe session
│           ├── session/                # GET  — retrieve session metadata
│           └── webhook/                # POST — handle checkout.session.completed
├── features/
│   ├── landing/
│   │   ├── HeroSection.tsx             # RSC — avatar, bio, skills grid
│   │   ├── TrustBar.tsx                # RSC — footer layout + payment badges
│   │   ├── FooterModals.tsx            # Client — policy modals + chat trigger
│   │   └── skill-icons.tsx             # RSC — SVG icons merged with skills data
│   └── booking/
│       ├── InteractiveShell.tsx        # Client boundary — all booking/auth state
│       ├── SessionCard.tsx             # Client — individual session card
│       └── PackCard.tsx                # Client — pack card with credit display
├── components/
│   ├── BookingModeView.tsx             # Cal.com embed + credit decrement flow
│   ├── SingleSessionBooking.tsx        # Full-screen single session flow
│   ├── PackModal.tsx                   # Pack purchase modal
│   ├── Chat.tsx                        # Gemini AI chat widget (fixed FAB)
│   ├── AuthCorner.tsx                  # Fixed top-right auth + credits badge
│   ├── SignInGate.tsx                  # Sign-in prompt modal
│   └── CalComBooking.tsx               # Cal.com embed wrapper
├── hooks/
│   ├── useUserSession.ts               # NextAuth session + credit state
│   └── useSSECredits.ts                # EventSource hook for SSE credit stream
├── lib/
│   ├── kv.ts                           # Upstash Redis CRUD for credit records
│   ├── gemini.ts                       # Gemini API client
│   ├── ratelimit.ts                    # Upstash rate limiters
│   ├── api-client.ts                   # Typed fetch wrapper
│   └── validation.ts                   # Email/input sanitisation
├── constants/
│   ├── index.ts                        # Pack config, Cal slugs, design tokens
│   ├── skills.ts                       # Skill items data
│   └── chat-prompt.ts                  # Gemini system prompt
└── types/index.ts                      # Shared TypeScript types
```

---

## Key design decisions

**Redis over Google Sheets for credits** — the original implementation stored credits in a Google Sheets spreadsheet. This caused a race condition: Stripe retries would fire two concurrent webhooks, both read the same credit count before either wrote back, and double-credits resulted. Migrating to Upstash Redis made writes atomic and the idempotency check (comparing `stripeSessionId` on the stored record) became a single key lookup.

**SSE over polling for post-payment confirmation** — the original `pago-exitoso` page polled `/api/credits` up to 8 times over 20 seconds from the browser. The replacement opens one SSE connection; the server polls Redis internally every 1.5s and pushes a single `credits_ready` event when the webhook has written the record. The browser makes one request instead of eight.

**Single client boundary on the landing page** — the entire page was a `"use client"` component, which sent the hero bio, skills grid, and footer to the browser as JavaScript. Extracting those into Server Components reduced the initial JS bundle by ~35% and improved LCP. Only `InteractiveShell` (booking/auth state) and `FooterModals` (policy modals, chat trigger) are client components.

**Cal.com webhook for cancellations** — Cal.com sends cancel confirmation emails to students with a cancellation link. Without a webhook, clicking that link would cancel the booking in Cal.com but leave the credit consumed in Redis. The `POST /api/cal/webhook` endpoint listens for `BOOKING_CANCELLED`, verifies the HMAC-SHA256 signature, and restores the credit automatically for pack classes.

---

## Local setup

### Prerequisites

- Node.js 18+
- An [Upstash](https://console.upstash.com) Redis database (free tier is sufficient)
- A [Stripe](https://stripe.com) account
- A [Cal.com](https://cal.com) account
- A Google Cloud project with OAuth credentials

### 1. Clone and install

```bash
git clone https://github.com/gussttaav/personal-web-booking-app.git
cd personal-web-booking-app
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
# ── Auth ──────────────────────────────────────────────────────────────
AUTH_SECRET=                        # openssl rand -hex 32
AUTH_GOOGLE_ID=                     # Google OAuth client ID
AUTH_GOOGLE_SECRET=                 # Google OAuth client secret

# ── Stripe ────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PACK5=price_...
STRIPE_PRICE_ID_PACK10=price_...
STRIPE_PRICE_ID_SESSION_1H=price_...
STRIPE_PRICE_ID_SESSION_2H=price_...

# ── Upstash Redis (rate limiting + credits) ───────────────────────────
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ── Cal.com ───────────────────────────────────────────────────────────
NEXT_PUBLIC_CAL_EVENT_SLUG=your-username/pack-class-slug
CAL_WEBHOOK_SECRET=                 # openssl rand -hex 32

# ── AI assistant ──────────────────────────────────────────────────────
GEMINI_API_KEY=

# ── Email notifications (optional — Resend) ───────────────────────────
RESEND_API_KEY=re_...
NOTIFY_EMAIL=your@email.com

# ── App ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run in development

```bash
npm run dev
# http://localhost:3000
```

### 4. Test Stripe webhooks locally

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the whsec_... shown and set it as STRIPE_WEBHOOK_SECRET
```

### 5. Test Cal.com webhooks locally

```bash
npx ngrok http 3000
# Register https://<your-ngrok-id>.ngrok.io/api/cal/webhook in Cal.com
# Settings → Developer → Webhooks → New webhook
# Trigger: BOOKING_CANCELLED
# Secret: value of CAL_WEBHOOK_SECRET
```

---

## Running tests

```bash
npx jest --coverage
```

Tests cover `lib/kv.ts` (credit CRUD, idempotency, expiry logic) and `lib/validation.ts` (email/pack size validation, sanitisation). The `googleapis` and `@upstash/redis` modules are mocked — no real network calls.

---

## Deployment

The project is deployed on Vercel. Set all environment variables from `.env.local` in the Vercel project settings before deploying.

**Stripe webhook (production)**

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/stripe/webhook`
3. Event: `checkout.session.completed`
4. Copy the signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel

**Cal.com webhook (production)**

1. Cal.com → Settings → Developer → Webhooks → New webhook
2. URL: `https://yourdomain.com/api/cal/webhook`
3. Trigger: `BOOKING_CANCELLED`
4. Secret: value of `CAL_WEBHOOK_SECRET`

---

## License

MIT — see [LICENSE](LICENSE).

---

## Contact

**Gustavo Torres Guerrero**
[gustavoai.dev](https://gustavoai.dev) · [LinkedIn](https://www.linkedin.com/in/gustavo-torres-guerrero) · [GitHub](https://github.com/gussttaav) · contacto@gustavoai.dev
