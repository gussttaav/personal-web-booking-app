import type { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import type { SubscriptionType } from "@/domain/types";
import { supabase } from "./client";

export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  async subscribe(userId: string, type: SubscriptionType): Promise<void> {
    const { error } = await supabase
      .from("subscriptions")
      .insert({ user_id: userId, type });

    // 23505 = unique_violation — already subscribed, treat as idempotent success
    if (error && error.code !== "23505") throw error;
  }

  async isSubscribed(userId: string, type: SubscriptionType): Promise<boolean> {
    const { count, error } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", type);

    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
