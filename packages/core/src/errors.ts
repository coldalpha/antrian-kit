export class QueueError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'QueueError';
  }
}

export class InvalidStateTransitionError extends QueueError {
  constructor(from: string, to: string, ticketId: string) {
    super(
      `Transisi status tidak valid untuk tiket ${ticketId}: dari '${from}' ke '${to}'.`,
      'INVALID_STATE_TRANSITION'
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export class TicketNotFoundError extends QueueError {
  constructor(ticketId: string) {
    super(`Tiket dengan ID '${ticketId}' tidak ditemukan.`, 'TICKET_NOT_FOUND');
    this.name = 'TicketNotFoundError';
  }
}

export class QueueNotFoundError extends QueueError {
  constructor(queueId: string) {
    super(`Antrean dengan ID '${queueId}' tidak ditemukan.`, 'QUEUE_NOT_FOUND');
    this.name = 'QueueNotFoundError';
  }
}
