Personal tutoring platform for booking programming, mathematics and AI classes. Built as a production Next.js application with Stripe payments, Upstash Redis, Server-Sent Events, and an AI assistant powered by Gemini.

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
| Bookings | Google Calendar API |
| Email notifications | Resend |
| Deployment | Vercel |
| Testing | Jest |

---

## Features

- **Individual sessions** — 15-min free intro, 1h and 2h paid sessions booked via Cal.com
- **Class packs** — buy 5 or 10 classes at a discount; credits stored in Redis and decremented on each booking
- **Stripe integration** — secure checkout with webhook signature verification and idempotency (no double-credits on retries)
- **Real-time credit activation** — Server-Sent Events push credit confirmation to the browser after payment; no polling
- **Google Calendar** — cancellations automatically restore credits to the student's pack; single-session cancellations notify by email
- **AI assistant** — Gemini-powered chat widget trained on full service details, pricing, cancellation policy, and background; answerable to FAQs without user needing to email
- **Google OAuth** — sign-in required before booking; session used server-side on all API routes (no URL-param trust)
- **Rate limiting** — sliding window limits on chat, credits, and checkout endpoints
- **RSC architecture** — static landing sections (hero, skills, footer) ship zero JavaScript; only interactive booking/auth state is a client component

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                 RSC root — HeroSection + TrustBar + InteractiveShell
│   ├── pago-exitoso/page.tsx    SSE polling after pack purchase (credits activation)
│   ├── sesion-confirmada/page.tsx Confirmation after single session payment
│   ├── cancelar/page.tsx        Cancellation via signed email link
│   ├── privacidad/page.tsx      Privacy Policy (Google OAuth verification)
│   ├── terminos/page.tsx        Terms of Service
│   └── api/
│       ├── availability/route.ts GET ?date&duration&tz → available daily slots
│       ├── book/route.ts         POST → creates Calendar event + deducts credit
│       ├── cancel/route.ts       POST {token} → deletes event + restores credit
│       ├── credits/route.ts      GET → authenticated student credits (Upstash)
│       ├── sse/route.ts          SSE → waits for credit activation after payment
│       └── stripe/
│           ├── checkout/route.ts POST → creates Stripe session (pack or single)
│           ├── session/route.ts  GET → verifies Stripe session post-payment
│           └── webhook/route.ts  POST ← Stripe → writes credits / creates event
├── features/
│   └── booking/
│       ├── InteractiveShell.tsx  Main client boundary on the landing page
│       ├── SessionCard.tsx       Single session card (interactive button)
│       └── PackCard.tsx          Pack card (interactive button)
├── components/
│   ├── WeeklyCalendar.tsx       Weekly calendar with real-time slots
│   ├── BookingModeView.tsx      Booking view for pack lessons
│   ├── SingleSessionBooking.tsx Booking view for single / free sessions
│   ├── PackModal.tsx            Pack purchase modal
│   ├── SignInGate.tsx           Auth modal (with dynamic callbackUrl)
│   ├── Chat.tsx                 Gemini virtual assistant
│   └── AuthCorner.tsx           Avatar + credits (top-right corner)
├── lib/
│   ├── booking-config.ts        Schedules per day (no Node deps — client-safe)
│   ├── calendar.ts              Google Calendar API: freebusy, create/delete events
│   ├── email.ts                 Resend: confirmation, cancellation, notifications
│   ├── kv.ts                    Upstash Redis: student credits
│   └── api-client.ts            Typed client for frontend fetch calls
└── hooks/
    └── useUserSession.ts        Google session + student credits
```

---

## Key Architectural Decisions

| Decision | Reasoning |
|---|---|
| Upstash Redis instead of Google Sheets | <5ms latency, no API quota limits, atomic operations for credits |
| SSE instead of polling for credits | Avoids multiple requests; a single connection waits for webhook activation |
| `booking-config.ts` separated from `calendar.ts` | `calendar.ts` uses `googleapis` (Node-only); client components need the config |
| Static Google Meet (`GOOGLE_MEET_URL`) | Google Meet and Calendar APIs don't allow service accounts to generate Meet links for personal Gmail accounts (requires Google Workspace + DWD) |
| HMAC-SHA256 Cancellation tokens in Redis | Enables cancellation/rescheduling without auth; single-use tokens prevent replay attacks |
| Dynamic `callbackUrl` in SignInGate | Preserves `?reschedule=&token=` parameters through the Google OAuth redirect, which otherwise destroys React state |
| Reschedule without Stripe for paid sessions | The token verifies the original session was paid; simply deletes the old event and creates a new one |
| Email send with retry (3 attempts) | Vercel freezes functions upon HTTP response; open TLS connections to Resend may receive ECONNRESET. Backoff retries resolve this on the 2nd/3rd call |

---

## Local setup

### Prerequisites

- Node.js 18+
- An [Upstash](https://console.upstash.com) Redis database (free tier is sufficient)
- A [Stripe](https://stripe.com) account
- A Google Cloud project with OAuth credentials
- A Google account service with Google Calendar API enabled

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

# ── Google Calendar (service account) ─────────────────────────────────
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your.email@gmail.com

# ── Google Meet (permanent room link) ─────────────────────────────────
GOOGLE_MEET_URL=https://meet.google.com/xxx-xxxx-xxx

# ── AI assistant ──────────────────────────────────────────────────────
GEMINI_API_KEY=

# ── Resend (transactional email) ──────────────────────────────────────
RESEND_API_KEY=re_...
RESEND_FROM=Your Name <contacto@gustavoai.dev>
NOTIFY_EMAIL=your.email@gmail.com

# ── Cancellation / Rescheduling ───────────────────────────────────────
CANCEL_SECRET=               # openssl rand -hex 32

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

**Google Cloud Configuration**

1. Create or open your project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Google Calendar API**
3. Create a **Service Account** → download JSON → copy `client_email` and `private_key`
4. In Google Calendar → your calendar → Settings → Share with specific people → add the service account email with **"Make changes to events"** permissions
5. `GOOGLE_CALENDAR_ID` = your Gmail address (e.g., `name@gmail.com`)

---

## License

MIT — see [LICENSE](LICENSE).

---

## Contact

**Gustavo Torres Guerrero**
[gustavoai.dev](https://gustavoai.dev) · [LinkedIn](https://www.linkedin.com/in/gustavo-torres-guerrero) · [GitHub](https://github.com/gussttaav) · contacto@gustavoai.dev
