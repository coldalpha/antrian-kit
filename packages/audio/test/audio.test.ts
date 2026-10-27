import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIndonesianNumberTokens,
  AudioSequenceBuilder,
  AudioQueuePlayer,
  MockAudioPlayerAdapter,
} from '../src/index.js';

describe('Indonesian Number Audio Tokens', () => {
  test('single digits (1 - 11)', () => {
    assert.deepEqual(buildIndonesianNumberTokens(1), [{ token: 'num:1', path: 'numbers/1.mp3' }]);
    assert.deepEqual(buildIndonesianNumberTokens(5), [{ token: 'num:5', path: 'numbers/5.mp3' }]);
    assert.deepEqual(buildIndonesianNumberTokens(10), [{ token: 'num:10', path: 'numbers/10.mp3' }]);
    assert.deepEqual(buildIndonesianNumberTokens(11), [{ token: 'num:11', path: 'numbers/11.mp3' }]);
  });

  test('belasan (12 - 19)', () => {
    assert.deepEqual(buildIndonesianNumberTokens(12), [
      { token: 'num:2', path: 'numbers/2.mp3' },
      { token: 'num:belas', path: 'numbers/belas.mp3' },
    ]);
    assert.deepEqual(buildIndonesianNumberTokens(19), [
      { token: 'num:9', path: 'numbers/9.mp3' },
      { token: 'num:belas', path: 'numbers/belas.mp3' },
    ]);
  });

  test('puluhan tepat (20, 30, 40)', () => {
    assert.deepEqual(buildIndonesianNumberTokens(20), [
      { token: 'num:2', path: 'numbers/2.mp3' },
      { token: 'num:puluh', path: 'numbers/puluh.mp3' },
    ]);
    assert.deepEqual(buildIndonesianNumberTokens(50), [
      { token: 'num:5', path: 'numbers/5.mp3' },
      { token: 'num:puluh', path: 'numbers/puluh.mp3' },
    ]);
  });

  test('puluhan dan satuan (21, 25, 99)', () => {
    assert.deepEqual(buildIndonesianNumberTokens(21), [
      { token: 'num:2', path: 'numbers/2.mp3' },
      { token: 'num:puluh', path: 'numbers/puluh.mp3' },
      { token: 'num:1', path: 'numbers/1.mp3' },
    ]);
    assert.deepEqual(buildIndonesianNumberTokens(25), [
      { token: 'num:2', path: 'numbers/2.mp3' },
      { token: 'num:puluh', path: 'numbers/puluh.mp3' },
      { token: 'num:5', path: 'numbers/5.mp3' },
    ]);
    assert.deepEqual(buildIndonesianNumberTokens(99), [
      { token: 'num:9', path: 'numbers/9.mp3' },
      { token: 'num:puluh', path: 'numbers/puluh.mp3' },
      { token: 'num:9', path: 'numbers/9.mp3' },
    ]);
  });

  test('ratusan (100, 105, 115, 125, 200, 345)', () => {
    assert.deepEqual(buildIndonesianNumberTokens(100), [
      { token: 'num:seratus', path: 'numbers/seratus.mp3' },
    ]);
    assert.deepEqual(buildIndonesianNumberTokens(105), [
      { token: 'num:seratus', path: 'numbers/seratus.mp3' },
      { token: 'num:5', path: 'numbers/5.mp3' },
    ]);
    assert.deepEqual(buildIndonesianNumberTokens(115), [
      { token: 'num:seratus', path: 'numbers/seratus.mp3' },
      { token: 'num:5', path: 'numbers/5.mp3' },
      { token: 'num:belas', path: 'numbers/belas.mp3' },
    ]);
    assert.deepEqual(buildIndonesianNumberTokens(125), [
      { token: 'num:seratus', path: 'numbers/seratus.mp3' },
      { token: 'num:2', path: 'numbers/2.mp3' },
      { token: 'num:puluh', path: 'numbers/puluh.mp3' },
      { token: 'num:5', path: 'numbers/5.mp3' },
    ]);
    assert.deepEqual(buildIndonesianNumberTokens(200), [
      { token: 'num:2', path: 'numbers/2.mp3' },
      { token: 'num:ratus', path: 'numbers/ratus.mp3' },
    ]);
    assert.deepEqual(buildIndonesianNumberTokens(345), [
      { token: 'num:3', path: 'numbers/3.mp3' },
      { token: 'num:ratus', path: 'numbers/ratus.mp3' },
      { token: 'num:4', path: 'numbers/4.mp3' },
      { token: 'num:puluh', path: 'numbers/puluh.mp3' },
      { token: 'num:5', path: 'numbers/5.mp3' },
    ]);
  });

  test('out of range throws RangeError', () => {
    assert.throws(() => buildIndonesianNumberTokens(0), RangeError);
    assert.throws(() => buildIndonesianNumberTokens(1000), RangeError);
  });
});

describe('AudioSequenceBuilder', () => {
  test('should build complete announcement sequence for ticket A-025', () => {
    const builder = new AudioSequenceBuilder({ baseAssetUrl: '/audio/id/' });
    const payload = builder.buildCallAnnouncement({
      ticketNumber: 'A-025',
      numberOnly: 25,
      destinationCode: 'klinik_gigi',
    });

    const expectedTokens = [
      'phrase:nomor_antrian',
      'num:2',
      'num:puluh',
      'num:5',
      'phrase:silakan_menuju',
      'dest:klinik_gigi',
    ];

    assert.equal(payload.ticketNumber, 'A-025');
    assert.deepEqual(
      payload.sequence.map((s) => s.token),
      expectedTokens
    );
    assert.deepEqual(
      payload.sequence.map((s) => s.path),
      [
        '/audio/id/phrases/nomor_antrian.mp3',
        '/audio/id/numbers/2.mp3',
        '/audio/id/numbers/puluh.mp3',
        '/audio/id/numbers/5.mp3',
        '/audio/id/phrases/silakan_menuju.mp3',
        '/audio/id/destinations/klinik_gigi.mp3',
      ]
    );
  });

  test('should support prefix letters and hundreds for ticket B-125', () => {
    const builder = new AudioSequenceBuilder({ baseAssetUrl: '/audio/id/' });
    const payload = builder.buildCallAnnouncement({
      ticketNumber: 'B-125',
      numberOnly: 125,
      prefix: 'B',
      destinationCode: 'umum',
      includeClinicPhrase: true,
    });

    const expectedTokens = [
      'phrase:nomor_antrian',
      'letter:b',
      'num:seratus',
      'num:2',
      'num:puluh',
      'num:5',
      'phrase:silakan_menuju',
      'phrase:ke_klinik',
      'dest:umum',
    ];

    assert.deepEqual(
      payload.sequence.map((s) => s.token),
      expectedTokens
    );
    assert.deepEqual(
      payload.sequence.map((s) => s.path),
      [
        '/audio/id/phrases/nomor_antrian.mp3',
        '/audio/id/letters/b.mp3',
        '/audio/id/numbers/seratus.mp3',
        '/audio/id/numbers/2.mp3',
        '/audio/id/numbers/puluh.mp3',
        '/audio/id/numbers/5.mp3',
        '/audio/id/phrases/silakan_menuju.mp3',
        '/audio/id/phrases/ke_klinik.mp3',
        '/audio/id/destinations/umum.mp3',
      ]
    );
  });

  test('should support klinik_umum destination', () => {
    const builder = new AudioSequenceBuilder({ baseAssetUrl: '/audio/id/' });
    const payload = builder.buildCallAnnouncement({
      ticketNumber: 'U-001',
      numberOnly: 1,
      destinationCode: 'klinik_umum',
    });

    const destItem = payload.sequence[payload.sequence.length - 1];
    assert.equal(destItem.token, 'dest:klinik_umum');
    assert.equal(destItem.path, '/audio/id/destinations/klinik_umum.mp3');
    assert.equal(destItem.text, 'klinik umum');
  });

  test('should prepend bell chime when bellChime is true', () => {
    const builder = new AudioSequenceBuilder({ baseAssetUrl: '/audio/id/' });
    const payload = builder.buildCallAnnouncement({
      ticketNumber: 'A-001',
      numberOnly: 1,
      prefix: 'A',
      destinationCode: 'klinik_umum',
      bellChime: true,
    });

    assert.equal(payload.sequence[0].token, 'bell:chime');
    assert.equal(payload.sequence[0].path, '/audio/id/bells/bell.mp3');
    assert.equal(payload.sequence[0].text, 'Ting Tung');
    assert.equal(payload.sequence[1].token, 'phrase:nomor_antrian');
    assert.equal(payload.sequence[2].token, 'letter:a');
  });
});

describe('AudioQueuePlayer', () => {
  test('should play sequence in order without collision', async () => {
    const mock = new MockAudioPlayerAdapter();
    mock.durationMs = 2;
    const player = new AudioQueuePlayer(mock);

    const builder = new AudioSequenceBuilder({ baseAssetUrl: '' });
    const a1 = builder.buildCallAnnouncement({ ticketNumber: '1', numberOnly: 1 });
    const a2 = builder.buildCallAnnouncement({ ticketNumber: '2', numberOnly: 2 });

    player.enqueue(a1);
    player.enqueue(a2);

    // Wait for queue completion
    while (player.getState() !== 'IDLE') {
      await new Promise((res) => setTimeout(res, 5));
    }

    assert.ok(mock.playedTracks.length > 0);
    assert.equal(mock.playedTracks[0], 'phrases/nomor_antrian.mp3');
    assert.equal(mock.playedTracks[1], 'numbers/1.mp3');
  });
});
