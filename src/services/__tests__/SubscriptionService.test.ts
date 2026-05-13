import { SubscriptionService } from "../SubscriptionService";
import { UserService }         from "../UserService";
import type { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { AlreadySubscribedError } from "@/domain/errors";

const TEST_USER_ID = "user-uuid-sub-test";

const mockSubs = (): jest.Mocked<ISubscriptionRepository> => ({
  subscribe:    jest.fn(),
  isSubscribed: jest.fn(),
});

const mockUserService = (): jest.Mocked<Pick<UserService, "ensureUser" | "findByEmail">> => ({
  ensureUser:  jest.fn().mockResolvedValue(TEST_USER_ID),
  findByEmail: jest.fn().mockResolvedValue({ id: TEST_USER_ID }),
});

function makeService(
  subsOverrides:    Partial<jest.Mocked<ISubscriptionRepository>> = {},
  userSvcOverrides: Partial<jest.Mocked<Pick<UserService, "ensureUser" | "findByEmail">>> = {},
) {
  const subs    = { ...mockSubs(),        ...subsOverrides };
  const userSvc = { ...mockUserService(), ...userSvcOverrides };
  const service = new SubscriptionService(subs, userSvc as unknown as UserService);
  return { service, subs, userSvc };
}

describe("SubscriptionService.subscribe", () => {
  it("ensures user exists then calls repo.subscribe with userId", async () => {
    const { service, subs, userSvc } = makeService();
    subs.isSubscribed.mockResolvedValue(false);
    subs.subscribe.mockResolvedValue(undefined);

    await service.subscribe("user@example.com", "courses");

    expect(userSvc.ensureUser).toHaveBeenCalledWith("user@example.com");
    expect(subs.isSubscribed).toHaveBeenCalledWith(TEST_USER_ID, "courses");
    expect(subs.subscribe).toHaveBeenCalledWith(TEST_USER_ID, "courses");
  });

  it("throws AlreadySubscribedError when already subscribed", async () => {
    const { service, subs } = makeService();
    subs.isSubscribed.mockResolvedValue(true);

    await expect(service.subscribe("user@example.com", "blog"))
      .rejects.toThrow(AlreadySubscribedError);

    expect(subs.subscribe).not.toHaveBeenCalled();
  });

  it("works for both subscription types", async () => {
    for (const type of ["courses", "blog"] as const) {
      const { service, subs } = makeService();
      subs.isSubscribed.mockResolvedValue(false);
      subs.subscribe.mockResolvedValue(undefined);

      await service.subscribe("a@b.com", type);

      expect(subs.subscribe).toHaveBeenCalledWith(TEST_USER_ID, type);
    }
  });
});

describe("SubscriptionService.isSubscribed", () => {
  it("returns true when subscribed", async () => {
    const { service, subs } = makeService();
    subs.isSubscribed.mockResolvedValue(true);

    const result = await service.isSubscribed("user@example.com", "courses");

    expect(result).toBe(true);
    expect(subs.isSubscribed).toHaveBeenCalledWith(TEST_USER_ID, "courses");
  });

  it("returns false when not subscribed", async () => {
    const { service, subs } = makeService();
    subs.isSubscribed.mockResolvedValue(false);

    const result = await service.isSubscribed("user@example.com", "blog");

    expect(result).toBe(false);
  });

  it("returns false when user does not exist", async () => {
    const { service, subs } = makeService({}, { findByEmail: jest.fn().mockResolvedValue(null) });

    const result = await service.isSubscribed("unknown@example.com", "courses");

    expect(result).toBe(false);
    expect(subs.isSubscribed).not.toHaveBeenCalled();
  });
});
