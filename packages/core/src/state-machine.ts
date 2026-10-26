import type { TicketStatus } from '@antrian-kit/contracts';
import { InvalidStateTransitionError } from './errors.js';

export const ALLOWED_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  WAITING: ['CALLED', 'SKIPPED', 'CANCELLED'],
  CALLED: ['CALLED', 'SERVING', 'SKIPPED', 'CANCELLED'],
  SERVING: ['COMPLETED', 'CANCELLED'],
  SKIPPED: ['CALLED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function validateTransition(from: TicketStatus, to: TicketStatus, ticketId: string): void {
  if (!canTransition(from, to)) {
    throw new InvalidStateTransitionError(from, to, ticketId);
  }
}
