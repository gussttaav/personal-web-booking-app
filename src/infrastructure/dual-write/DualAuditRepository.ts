// DB-03: Dual-write wrapper for audit log operations.
// Writes fan out to primary (Redis) and shadow (Supabase). Reads come from
// primary only. Shadow failures are logged but never thrown.
// Temporary: deleted after Task 4.5 flips primary to Supabase.
import type { IAuditRepository } from "@/domain/repositories/IAuditRepository";
import type { AuditEntry } from "@/domain/types";
import { log } from "@/lib/logger";

export class DualAuditRepository implements IAuditRepository {
  constructor(
    private readonly primary: IAuditRepository,
    private readonly shadow:  IAuditRepository,
  ) {}

  async append(email: string, entry: Omit<AuditEntry, "ts">): Promise<void> {
    await this.primary.append(email, entry);
    this.shadow.append(email, entry).catch((err) =>
      log("warn", "Shadow write failed: audit.append", { service: "dual-write", email, error: String(err) })
    );
  }

  async list(email: string, limit?: number): Promise<AuditEntry[]> {
    return this.primary.list(email, limit);
  }
}
