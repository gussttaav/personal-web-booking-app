import { UserService } from "../UserService";
import type { IUserRepository } from "@/domain/repositories/IUserRepository";

const mockRepo = (): jest.Mocked<IUserRepository> => ({
  upsert:       jest.fn(),
  findByEmail:  jest.fn(),
});

describe("UserService.ensureUser", () => {
  it("delegates to IUserRepository.upsert and returns the id", async () => {
    const repo = mockRepo();
    repo.upsert.mockResolvedValue("uuid-abc-123");

    const service = new UserService(repo);
    const id = await service.ensureUser("Test@Example.com", "Test User", "https://avatar.url");

    expect(repo.upsert).toHaveBeenCalledWith("Test@Example.com", "Test User", "https://avatar.url");
    expect(id).toBe("uuid-abc-123");
  });

  it("passes undefined name and avatarUrl when omitted", async () => {
    const repo = mockRepo();
    repo.upsert.mockResolvedValue("uuid-def-456");

    await new UserService(repo).ensureUser("a@b.com");

    expect(repo.upsert).toHaveBeenCalledWith("a@b.com", undefined, undefined);
  });
});

describe("UserService.findByEmail", () => {
  it("returns the user id when found", async () => {
    const repo = mockRepo();
    repo.findByEmail.mockResolvedValue({ id: "uuid-found" });

    const result = await new UserService(repo).findByEmail("user@example.com");

    expect(repo.findByEmail).toHaveBeenCalledWith("user@example.com");
    expect(result).toEqual({ id: "uuid-found" });
  });

  it("returns null when user does not exist", async () => {
    const repo = mockRepo();
    repo.findByEmail.mockResolvedValue(null);

    const result = await new UserService(repo).findByEmail("ghost@example.com");

    expect(result).toBeNull();
  });
});
