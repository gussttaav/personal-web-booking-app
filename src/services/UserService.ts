import type { IUserRepository } from "@/domain/repositories/IUserRepository";

export class UserService {
  constructor(private readonly users: IUserRepository) {}

  async ensureUser(email: string, name?: string, avatarUrl?: string): Promise<string> {
    return this.users.upsert(email, name, avatarUrl);
  }

  async findByEmail(email: string): Promise<{ id: string } | null> {
    return this.users.findByEmail(email);
  }
}
