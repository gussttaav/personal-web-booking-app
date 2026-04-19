// ARCH-13: Thin wrapper around lib/calendar.ts so BookingService can depend on
// an interface rather than a concrete module — enables testing with mocks.
import * as calendarLib from "@/lib/calendar";
import type { ICalendarClient, CreateEventParams, CreateEventResult } from "./ICalendarClient";

export class CalendarClient implements ICalendarClient {
  async createEvent(params: CreateEventParams): Promise<CreateEventResult> {
    return calendarLib.createCalendarEvent(params);
  }

  async deleteEvent(eventId: string): Promise<void> {
    return calendarLib.deleteCalendarEvent(eventId);
  }
}
