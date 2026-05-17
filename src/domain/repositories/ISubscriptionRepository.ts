import type { SubscriptionType } from "../types";

export interface ISubscriptionRepository {
  subscribe(userId: string, type: SubscriptionType): Promise<void>;
  isSubscribed(userId: string, type: SubscriptionType): Promise<boolean>;
}
