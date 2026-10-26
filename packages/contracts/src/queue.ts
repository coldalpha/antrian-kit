export type TicketStatus =
  | 'WAITING'
  | 'CALLED'
  | 'SERVING'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED';

export interface Ticket {
  id: string;
  queueId: string;
  ticketNumber: string; // e.g. "A-001" or "001"
  sequenceNumber: number; // pure numeric order
  prefix?: string; // e.g. "A", "B"
  numberOnly: number; // e.g. 1, 25
  status: TicketStatus;
  callerUnit?: string; // e.g. "Poli Umum", "Klinik Gigi", "Loket 1"
  callerDeviceId?: string;
  calledCount: number;
  createdAt: string; // ISO 8601
  calledAt?: string;
  servingAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface QueueDefinition {
  id: string;
  code: string; // e.g. "POLI-GIGI", "FARMASI"
  name: string; // e.g. "Antrean Poli Gigi"
  prefix: string; // e.g. "A", "G"
  startNumber: number;
  currentNumber: number;
  isActive: boolean;
  destinationName: string; // e.g. "Klinik Gigi", "Poli Umum"
  metadata?: Record<string, unknown>;
}

export interface CallLog {
  id: string;
  ticketId: string;
  queueId: string;
  ticketNumber: string;
  destination: string;
  callerDeviceId?: string;
  operatorName?: string;
  calledAt: string;
  repeatIndex: number; // 1 for first call, 2 for recall
}

export interface Device {
  id: string;
  name: string;
  role: 'DISPLAY' | 'SPEAKER' | 'CALLER' | 'KIOSK';
  assignedUnit?: string;
  isOnline: boolean;
  lastHeartbeatAt?: string;
}
