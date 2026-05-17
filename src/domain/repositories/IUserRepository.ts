export interface IUserRepository {
  upsert(email: string, name?: string, avatarUrl?: string): Promise<string>;
  findByEmail(email: string): Promise<{ id: string } | null>;
}
