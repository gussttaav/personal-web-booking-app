// DB-03: Dual-write wrapper for Zoom session operations.
// Writes fan out to primary (Redis) and shadow (Supabase). Reads come from
// primary only. Shadow failures are logged but never thrown.
// Temporary: deleted after Task 4.5 flips primary to Supabase.
import type { ISessionRepository } from "@/domain/repositories/ISessionRepository";
import type { ZoomSession } from "@/domain/types";
import { log } from "@/lib/logger";

export class DualSessionRepository implements ISessionRepository {
  constructor(
    private readonly primary: ISessionRepository,
    private readonly shadow:  ISessionRepository,
  ) {}

  async createSession(eventId: string, session: ZoomSession): Promise<void> {
    await this.primary.createSession(eventId, session);
    this.shadow.createSession(eventId, session).catch((err) =>
      log("warn", "Shadow write failed: createSession", { service: "dual-write", eventId, error: String(err) })
    );
  }

  async findByEventId(eventId: string): Promise<ZoomSession | null> {
    return this.primary.findByEventId(eventId);
  }

  async deleteByEventId(eventId: string): Promise<void> {
    await this.primary.deleteByEventId(eventId);
    this.shadow.deleteByEventId(eventId).catch((err) =>
      log("warn", "Shadow write failed: deleteByEventId", { service: "dual-write", eventId, error: String(err) })
    );
  }

  async appendChatMessage(eventId: string, message: string): Promise<number> {
    const count = await this.primary.appendChatMessage(eventId, message);
    this.shadow.appendChatMessage(eventId, message).catch((err) =>
      log("warn", "Shadow write failed: appendChatMessage", { service: "dual-write", eventId, error: String(err) })
    );
    return count;
  }

  async listChatMessages(eventId: string, from: number, to: number): Promise<string[]> {
    return this.primary.listChatMessages(eventId, from, to);
  }

  async countChatMessages(eventId: string): Promise<number> {
    return this.primary.countChatMessages(eventId);
  }
}
