import type {
  QueueDefinition,
  Ticket,
  CallLog,
  QueueEvent,
  TicketCreatedEvent,
  TicketCalledEvent,
  TicketRecalledEvent,
  TicketServingEvent,
  TicketCompletedEvent,
  TicketSkippedEvent,
} from '@antrian-kit/contracts';
import { validateTransition } from './state-machine.js';
import { QueueNotFoundError, TicketNotFoundError } from './errors.js';

export interface QueueManagerOptions {
  onEvent?: (event: QueueEvent) => void;
}

export class QueueManager {
  private queues = new Map<string, QueueDefinition>();
  private tickets = new Map<string, Ticket>();
  private callLogs: CallLog[] = [];
  private onEvent?: (event: QueueEvent) => void;

  constructor(options: QueueManagerOptions = {}) {
    this.onEvent = options.onEvent;
  }

  public registerQueue(def: Omit<QueueDefinition, 'currentNumber'>): QueueDefinition {
    const queue: QueueDefinition = {
      ...def,
      currentNumber: def.startNumber > 0 ? def.startNumber - 1 : 0,
    };
    this.queues.set(queue.id, queue);
    return queue;
  }

  public getQueue(queueId: string): QueueDefinition {
    const q = this.queues.get(queueId);
    if (!q) throw new QueueNotFoundError(queueId);
    return q;
  }

  public issueTicket(queueId: string, metadata?: Record<string, unknown>): Ticket {
    const queue = this.getQueue(queueId);
    queue.currentNumber += 1;

    const numStr = String(queue.currentNumber).padStart(3, '0');
    const ticketNumber = queue.prefix ? `${queue.prefix}-${numStr}` : numStr;

    const ticket: Ticket = {
      id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      queueId: queue.id,
      ticketNumber,
      sequenceNumber: queue.currentNumber,
      prefix: queue.prefix || undefined,
      numberOnly: queue.currentNumber,
      status: 'WAITING',
      calledCount: 0,
      createdAt: new Date().toISOString(),
      metadata,
    };

    this.tickets.set(ticket.id, ticket);

    this.emit<TicketCreatedEvent>({
      id: `evt_${Date.now()}`,
      type: 'ticket.created',
      timestamp: ticket.createdAt,
      queueId: ticket.queueId,
      payload: { ticket },
    });

    return ticket;
  }

  public callTicket(
    ticketId: string,
    callerUnit?: string,
    callerDeviceId?: string,
    operatorName?: string
  ): { ticket: Ticket; log: CallLog } {
    const ticket = this.getTicket(ticketId);
    const queue = this.getQueue(ticket.queueId);
    const destination = callerUnit || queue.destinationName;

    // Validate state transition (WAITING -> CALLED or SKIPPED -> CALLED)
    validateTransition(ticket.status, 'CALLED', ticket.id);

    const now = new Date().toISOString();
    ticket.status = 'CALLED';
    ticket.calledCount += 1;
    ticket.calledAt = now;
    ticket.callerUnit = destination;
    ticket.callerDeviceId = callerDeviceId;

    const log: CallLog = {
      id: `log_${Date.now()}`,
      ticketId: ticket.id,
      queueId: ticket.queueId,
      ticketNumber: ticket.ticketNumber,
      destination,
      callerDeviceId,
      operatorName,
      calledAt: now,
      repeatIndex: ticket.calledCount,
    };
    this.callLogs.push(log);

    const isRecall = ticket.calledCount > 1;
    const eventType = isRecall ? 'ticket.recalled' : 'ticket.called';

    this.emit<TicketCalledEvent | TicketRecalledEvent>({
      id: `evt_${Date.now()}`,
      type: eventType,
      timestamp: now,
      queueId: ticket.queueId,
      payload: {
        ticket,
        log,
        announcement: {
          id: `ann_${Date.now()}`,
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          destination,
          language: 'id-ID',
          sequence: [], // Filled by audio sequence builder
          repeatCount: 1,
        },
      },
    });

    return { ticket, log };
  }

  public callNext(
    queueId: string,
    callerUnit?: string,
    callerDeviceId?: string,
    operatorName?: string
  ): { ticket: Ticket; log: CallLog } | null {
    const nextTicket = Array.from(this.tickets.values())
      .filter((t) => t.queueId === queueId && t.status === 'WAITING')
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)[0];

    if (!nextTicket) return null;

    return this.callTicket(nextTicket.id, callerUnit, callerDeviceId, operatorName);
  }

  public startServing(ticketId: string): Ticket {
    const ticket = this.getTicket(ticketId);
    validateTransition(ticket.status, 'SERVING', ticket.id);

    ticket.status = 'SERVING';
    ticket.servingAt = new Date().toISOString();

    this.emit<TicketServingEvent>({
      id: `evt_${Date.now()}`,
      type: 'ticket.serving',
      timestamp: ticket.servingAt,
      queueId: ticket.queueId,
      payload: { ticket },
    });

    return ticket;
  }

  public completeTicket(ticketId: string): Ticket {
    const ticket = this.getTicket(ticketId);
    validateTransition(ticket.status, 'COMPLETED', ticket.id);

    ticket.status = 'COMPLETED';
    ticket.completedAt = new Date().toISOString();

    this.emit<TicketCompletedEvent>({
      id: `evt_${Date.now()}`,
      type: 'ticket.completed',
      timestamp: ticket.completedAt,
      queueId: ticket.queueId,
      payload: { ticket },
    });

    return ticket;
  }

  public skipTicket(ticketId: string): Ticket {
    const ticket = this.getTicket(ticketId);
    validateTransition(ticket.status, 'SKIPPED', ticket.id);

    ticket.status = 'SKIPPED';

    this.emit<TicketSkippedEvent>({
      id: `evt_${Date.now()}`,
      type: 'ticket.skipped',
      timestamp: new Date().toISOString(),
      queueId: ticket.queueId,
      payload: { ticket },
    });

    return ticket;
  }

  public getTicket(ticketId: string): Ticket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new TicketNotFoundError(ticketId);
    return ticket;
  }

  public getTicketsByQueue(queueId: string): Ticket[] {
    return Array.from(this.tickets.values()).filter((t) => t.queueId === queueId);
  }

  public getWaitingTickets(queueId: string): Ticket[] {
    return this.getTicketsByQueue(queueId)
      .filter((t) => t.status === 'WAITING')
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  public getActiveTicket(queueId: string): Ticket | null {
    return (
      this.getTicketsByQueue(queueId)
        .filter((t) => t.status === 'CALLED' || t.status === 'SERVING')
        .sort((a, b) => {
          const timeA = new Date(a.calledAt || 0).getTime();
          const timeB = new Date(b.calledAt || 0).getTime();
          return timeB - timeA;
        })[0] || null
    );
  }

  private emit<T extends QueueEvent>(event: T): void {
    if (this.onEvent) {
      try {
        this.onEvent(event);
      } catch (err) {
        console.error('Queue event handler error:', err);
      }
    }
  }
}
