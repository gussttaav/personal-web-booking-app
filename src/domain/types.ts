// ARCH-10: Domain types — shared across services and repository interfaces.
// These live here so the domain layer has no external dependencies.
// Source of truth for shapes; src/lib/kv.ts mirrors CreditRecord/AuditEntry locally
// until 3.7 consolidates everything here.

export type PackSize = 5 | 10;

export type SessionType = "free15min" | "session1h" | "session2h" | "pack";

export interface CreditRecord {
  email:           string;
  name:            string;
  credits:         number;
  packLabel:       string;
  packSize:        PackSize | null;
  expiresAt:       string;       // ISO
  lastUpdated:     string;       // ISO
  stripeSessionId: string;
}

export interface BookingRecord {
  eventId:      string;
  email:        string;
  name:         string;
  sessionType:  SessionType;
  startsAt:     string;
  endsAt:       string;
  used:         boolean;
  packSize?:    number;
}

export interface ZoomSession {
  sessionId:       string;
  sessionName:     string;
  sessionPasscode: string;
  studentEmail:    string;
  startIso:        string;
  durationMinutes: number;
  sessionType:     SessionType;
}

export interface AuditEntry {
  action: string;
  ts:     string;
  [key: string]: unknown;
}
