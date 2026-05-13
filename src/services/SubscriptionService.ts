import type { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import type { SubscriptionType } from "@/domain/types";
import { AlreadySubscribedError } from "@/domain/errors";
import { UserService } from "./UserService";

export class SubscriptionService {
  constructor(
    private readonly subs:        ISubscriptionRepository,
    private readonly userService: UserService,
  ) {}

  async subscribe(email: string, type: SubscriptionType): Promise<void> {
    const userId = await this.userService.ensureUser(email);
    const already = await this.subs.isSubscribed(userId, type);
    if (already) throw new AlreadySubscribedError();
    await this.subs.subscribe(userId, type);
  }

  async isSubscribed(email: string, type: SubscriptionType): Promise<boolean> {
    const user = await this.userService.findByEmail(email);
    if (!user) return false;
    return this.subs.isSubscribed(user.id, type);
  }
}
