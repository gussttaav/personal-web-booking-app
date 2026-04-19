// ARCH-13: Calendar client interface — enables testing BookingService with mocks.
import type { SessionType } from "@/domain/types";

export interface CreateEventParams {
  summary:      string;
  description:  string;
  startIso:     string;
  endIso:       string;
  sessionType:  SessionType;
  studentEmail: string;
}

export interface CreateEventResult {
  eventId:         string;
  zoomSessionName: string;
  zoomPasscode:    string;
}

export interface ICalendarClient {
  createEvent(params: CreateEventParams): Promise<CreateEventResult>;
  deleteEvent(eventId: string): Promise<void>;
}
