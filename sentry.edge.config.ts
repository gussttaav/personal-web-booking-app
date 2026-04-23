// OBS-02: Sentry edge-runtime SDK configuration.
// Covers middleware and edge routes. The edge runtime has a restricted API
// surface so beforeSend / ignoreErrors are omitted — server config handles those.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? "development",

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enabled:
    process.env.NODE_ENV === "production" ||
    process.env.SENTRY_ENABLE_DEV === "true",
});
