// ARCH-11 — Repository singletons. Services import these by default; tests can
// construct alternative implementations directly.
import { RedisCreditsRepository } from "./RedisCreditsRepository";
import { RedisBookingRepository }  from "./RedisBookingRepository";
import { RedisSessionRepository }  from "./RedisSessionRepository";
import { RedisPaymentRepository }  from "./RedisPaymentRepository";
import { RedisAuditRepository }    from "./RedisAuditRepository";

export const creditsRepository = new RedisCreditsRepository();
export const bookingRepository  = new RedisBookingRepository();
export const sessionRepository  = new RedisSessionRepository();
export const paymentRepository  = new RedisPaymentRepository();
export const auditRepository    = new RedisAuditRepository();
