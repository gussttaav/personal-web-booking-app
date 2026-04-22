// TEST-01: Fake IScheduler for integration tests.
import type { IScheduler, ScheduleParams } from "@/infrastructure/qstash/IScheduler";

export class FakeScheduler implements IScheduler {
  scheduled:  ScheduleParams[] = [];
  shouldFail  = false;

  async scheduleAt(params: ScheduleParams): Promise<void> {
    if (this.shouldFail) throw new Error("FakeScheduler: simulated failure");
    this.scheduled.push(params);
  }
}
