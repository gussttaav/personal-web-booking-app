// ARCH-13: Scheduler interface — enables testing BookingService with mocks.
export interface ScheduleParams {
  url:          string;
  body:         unknown;
  delaySeconds: number;
}

export interface IScheduler {
  scheduleAt(params: ScheduleParams): Promise<void>;
}
