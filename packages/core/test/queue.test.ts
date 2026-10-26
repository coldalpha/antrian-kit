import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { QueueManager, InvalidStateTransitionError } from '../src/index.js';

describe('QueueManager Core Tests', () => {
  test('should issue consecutive tickets with prefix', () => {
    const qm = new QueueManager();
    qm.registerQueue({
      id: 'q_gigi',
      code: 'POLI_GIGI',
      name: 'Poli Gigi',
      prefix: 'G',
      startNumber: 1,
      isActive: true,
      destinationName: 'Klinik Gigi',
    });

    const t1 = qm.issueTicket('q_gigi');
    const t2 = qm.issueTicket('q_gigi');

    assert.equal(t1.ticketNumber, 'G-001');
    assert.equal(t1.numberOnly, 1);
    assert.equal(t1.status, 'WAITING');

    assert.equal(t2.ticketNumber, 'G-002');
    assert.equal(t2.numberOnly, 2);
    assert.equal(t2.status, 'WAITING');
  });

  test('should follow state machine: WAITING -> CALLED -> SERVING -> COMPLETED', () => {
    const qm = new QueueManager();
    qm.registerQueue({
      id: 'q_umum',
      code: 'POLI_UMUM',
      name: 'Poli Umum',
      prefix: 'A',
      startNumber: 1,
      isActive: true,
      destinationName: 'Klinik Umum',
    });

    const ticket = qm.issueTicket('q_umum');
    assert.equal(ticket.status, 'WAITING');

    // Call ticket
    const { ticket: calledTicket } = qm.callTicket(ticket.id);
    assert.equal(calledTicket.status, 'CALLED');
    assert.equal(calledTicket.calledCount, 1);

    // Recall ticket
    const { ticket: recalledTicket } = qm.callTicket(ticket.id);
    assert.equal(recalledTicket.status, 'CALLED');
    assert.equal(recalledTicket.calledCount, 2);

    // Start serving
    const servingTicket = qm.startServing(ticket.id);
    assert.equal(servingTicket.status, 'SERVING');

    // Complete ticket
    const completedTicket = qm.completeTicket(ticket.id);
    assert.equal(completedTicket.status, 'COMPLETED');

    // Trying to call completed ticket must throw InvalidStateTransitionError
    assert.throws(() => {
      qm.callTicket(ticket.id);
    }, InvalidStateTransitionError);
  });

  test('should support skipping and recalling skipped tickets', () => {
    const qm = new QueueManager();
    qm.registerQueue({
      id: 'q1',
      code: 'Q1',
      name: 'Antrean 1',
      prefix: '',
      startNumber: 1,
      isActive: true,
      destinationName: 'Loket 1',
    });

    const t = qm.issueTicket('q1');
    qm.skipTicket(t.id);
    assert.equal(qm.getTicket(t.id).status, 'SKIPPED');

    // Calling skipped ticket back to CALLED is valid
    qm.callTicket(t.id);
    assert.equal(qm.getTicket(t.id).status, 'CALLED');
  });

  test('callNext should pick next available waiting ticket in sequence', () => {
    const qm = new QueueManager();
    qm.registerQueue({
      id: 'q_fifo',
      code: 'FIFO',
      name: 'FIFO Queue',
      prefix: 'B',
      startNumber: 1,
      isActive: true,
      destinationName: 'Poli Anak',
    });

    qm.issueTicket('q_fifo'); // B-001
    qm.issueTicket('q_fifo'); // B-002

    const call1 = qm.callNext('q_fifo');
    assert.ok(call1);
    assert.equal(call1!.ticket.ticketNumber, 'B-001');

    const call2 = qm.callNext('q_fifo');
    assert.ok(call2);
    assert.equal(call2!.ticket.ticketNumber, 'B-002');

    const call3 = qm.callNext('q_fifo');
    assert.equal(call3, null); // queue empty
  });
});
