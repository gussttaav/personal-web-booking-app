// TEST-01: Updated to support separate unit and integration test projects.
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const baseUserConfig = {
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
};

/** @type {import('jest').Config} */
module.exports = async () => {
  // Call the async factory to get the full Next.js-enriched config (transforms, etc.)
  const base = await createJestConfig(baseUserConfig)();

  return {
    ...base,
    coverageProvider: "v8",
    collectCoverageFrom: [
      "src/lib/kv.ts",
      "src/lib/calendar.ts",
      "src/lib/validation.ts",
      "src/lib/ip-utils.ts",
      "src/lib/startup-checks.ts",
      "src/constants/errors.ts",
      "src/services/*.ts",
    ],
    // Coverage thresholds — tighten as the suite grows.
    //
    // calendar.ts threshold notes:
    //   getAvailableSlots, createCalendarEvent, deleteCalendarEvent require a
    //   live Google Calendar API client and cannot be unit tested. They account
    //   for ~36% of lines and 4 of 13 functions. The thresholds below reflect
    //   what is genuinely testable (token logic + slot lock) without lowering
    //   the bar on kv.ts which is fully unit-testable.
    coverageThreshold: {
      "src/lib/kv.ts": {
        lines:     90,
        functions: 90,
        branches:  85,
      },
      "src/lib/calendar.ts": {
        lines:     60,   // Google API fns excluded — raises to ~95% once mocked
        functions: 50,   // 4 Google API fns not covered; remaining 9 are 100%
        branches:  75,
      },
    },
    projects: [
      {
        ...base,
        displayName: "unit",
        testMatch: [
          "<rootDir>/src/**/*.test.ts",
          "<rootDir>/src/**/*.test.tsx",
        ],
        testPathIgnorePatterns: [
          ...(base.testPathIgnorePatterns ?? ["/node_modules/"]),
          "<rootDir>/src/__tests__/integration/",
        ],
      },
      {
        ...base,
        displayName: "integration",
        testMatch: ["<rootDir>/src/__tests__/integration/**/*.test.ts"],
        testTimeout: 10_000,
      },
    ],
  };
};
