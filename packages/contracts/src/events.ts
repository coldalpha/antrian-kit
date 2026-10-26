import type { Ticket, CallLog } from './queue.js';
import type { AudioAnnouncementPayload } from './audio.js';

export type QueueEventType =
  | 'ticket.created'
  | 'ticket.called'
  | 'ticket.recalled'
  | 'ticket.serving'
  | 'ticket.completed'
  | 'ticket.skipped'
  | 'queue.reset'
  | 'audio.announcement';

export interface BaseQueueEvent<T = unknown> {
  id: string;
  type: QueueEventType;
  timestamp: string; // ISO 8601
  queueId: string;
  payload: T;
}

export type TicketCreatedEvent = BaseQueueEvent<{ ticket: Ticket }>;
export type TicketCalledEvent = BaseQueueEvent<{
  ticket: Ticket;
  log: CallLog;
  announcement: AudioAnnouncementPayload;
}>;
export type TicketRecalledEvent = BaseQueueEvent<{
  ticket: Ticket;
  log: CallLog;
  announcement: AudioAnnouncementPayload;
}>;
export type TicketServingEvent = BaseQueueEvent<{ ticket: Ticket }>;
export type TicketCompletedEvent = BaseQueueEvent<{ ticket: Ticket }>;
export type TicketSkippedEvent = BaseQueueEvent<{ ticket: Ticket }>;
export type QueueResetEvent = BaseQueueEvent<{ queueId: string; resetAt: string }>;
export type SpeakerAnnouncementEvent = BaseQueueEvent<AudioAnnouncementPayload>;

export type QueueEvent =
  | TicketCreatedEvent
  | TicketCalledEvent
  | TicketRecalledEvent
  | TicketServingEvent
  | TicketCompletedEvent
  | TicketSkippedEvent
  | QueueResetEvent
  | SpeakerAnnouncementEvent;
