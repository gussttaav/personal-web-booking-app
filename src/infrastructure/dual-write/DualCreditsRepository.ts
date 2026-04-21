// DB-03: Dual-write wrapper for credit operations.
// Writes fan out to primary (Redis) and shadow (Supabase). Reads come from
// primary only. Shadow failures are logged but never thrown — the user-facing
// flow must not depend on the shadow.
// Temporary: deleted after Task 4.5 flips primary to Supabase.
import type { ICreditsRepository, CreditResult } from "@/domain/repositories/ICreditsRepository";
import { log } from "@/lib/logger";

export class DualCreditsRepository implements ICreditsRepository {
  constructor(
    private readonly primary: ICreditsRepository,
    private readonly shadow:  ICreditsRepository,
  ) {}

  async getCredits(email: string): Promise<CreditResult | null> {
    return this.primary.getCredits(email);
  }

  async addCredits(params: Parameters<ICreditsRepository["addCredits"]>[0]): Promise<void> {
    await this.primary.addCredits(params);
    this.shadow.addCredits(params).catch((err) =>
      log("warn", "Shadow write failed: addCredits", {
        service: "dual-write",
        email: params.email,
        stripeSessionId: params.stripeSessionId,
        error: String(err),
      })
    );
  }

  async decrementCredit(email: string): Promise<{ ok: boolean; remaining: number }> {
    const result = await this.primary.decrementCredit(email);
    if (result.ok) {
      this.shadow.decrementCredit(email).catch((err) =>
        log("warn", "Shadow write failed: decrementCredit", { service: "dual-write", email, error: String(err) })
      );
    }
    return result;
  }

  async restoreCredit(email: string): Promise<{ ok: boolean; credits: number }> {
    const result = await this.primary.restoreCredit(email);
    if (result.ok) {
      this.shadow.restoreCredit(email).catch((err) =>
        log("warn", "Shadow write failed: restoreCredit", { service: "dual-write", email, error: String(err) })
      );
    }
    return result;
  }
}
