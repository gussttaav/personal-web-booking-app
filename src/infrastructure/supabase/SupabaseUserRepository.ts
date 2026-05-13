import type { IUserRepository } from "@/domain/repositories/IUserRepository";
import { supabase } from "./client";

export class SupabaseUserRepository implements IUserRepository {
  async upsert(email: string, name?: string, avatarUrl?: string): Promise<string> {
    const normalized = email.toLowerCase().trim();

    const payload: Record<string, string> = { email: normalized };
    if (name)      payload.name       = name;
    if (avatarUrl) payload.avatar_url = avatarUrl;

    const { data, error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "email" })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  async findByEmail(email: string): Promise<{ id: string } | null> {
    const normalized = email.toLowerCase().trim();
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }
}
