// OBS-02: Sentry browser SDK configuration.
// Runs in the user's browser on every page load.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",

  // Only report in production — avoids polluting the project during development
  enabled: process.env.NODE_ENV === "production",

  tracesSampleRate: 0.1,

  // Capture replays only when an error occurs; session replay disabled (privacy)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
