// ARCH-10: Audit repository interface.
import type { AuditEntry } from "../types";

export interface IAuditRepository {
  /**
   * Appends an audit entry for a user. The implementation sets the `ts` field
   * to the current ISO timestamp. Non-blocking — implementations should not let
   * audit failures propagate to callers.
   */
  append(email: string, entry: Omit<AuditEntry, "ts">): Promise<void>;

  /**
   * Returns the most recent audit entries for a user, newest first. Defaults
   * to a reasonable cap (e.g. 100) if limit is not specified. Returns an empty
   * array if no entries exist for the email.
   */
  list(email: string, limit?: number): Promise<AuditEntry[]>;
}
