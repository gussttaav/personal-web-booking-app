// OBS-02: Verify that error-level logs are forwarded to Sentry.
import * as Sentry from "@sentry/nextjs";
import { log } from "@/lib/logger";

jest.mock("@sentry/nextjs");

const mockCaptureMessage = Sentry.captureMessage as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("log()", () => {
  test("error level forwards to Sentry.captureMessage", () => {
    log("error", "something failed", { service: "test", foo: "bar" });

    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith("something failed", {
      level: "error",
      extra: expect.objectContaining({ service: "test", foo: "bar" }),
      tags: { service: "test" },
    });
  });

  test("warn level does not call Sentry", () => {
    log("warn", "something slow", { service: "kv" });
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  test("info level does not call Sentry", () => {
    log("info", "credits updated", { service: "kv", credits: 3 });
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  test("error with no context uses 'unknown' service tag", () => {
    log("error", "bare error");

    expect(mockCaptureMessage).toHaveBeenCalledWith("bare error", {
      level: "error",
      extra: {},
      tags: { service: "unknown" },
    });
  });
});
