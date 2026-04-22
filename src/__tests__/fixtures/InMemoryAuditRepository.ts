// TEST-01: In-memory implementation of IAuditRepository for integration tests.
import type { IAuditRepository } from "@/domain/repositories/IAuditRepository";
import type { AuditEntry } from "@/domain/types";

export class InMemoryAuditRepository implements IAuditRepository {
  private store = new Map<string, AuditEntry[]>();

  async append(email: string, entry: Omit<AuditEntry, "ts">): Promise<void> {
    const key     = email.toLowerCase();
    const entries = this.store.get(key) ?? [];
    entries.push({ ...entry, ts: new Date().toISOString() } as AuditEntry);
    this.store.set(key, entries);
  }

  async list(email: string, limit = 50): Promise<AuditEntry[]> {
    const entries = this.store.get(email.toLowerCase()) ?? [];
    return entries.slice(-limit);
  }

  /** Test helper: returns all entries for an email. */
  getAll(email: string): AuditEntry[] {
    return this.store.get(email.toLowerCase()) ?? [];
  }
}
