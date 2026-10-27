import type {
  AudioAnnouncementPayload,
  AudioSequenceItem,
} from '@antrian-kit/contracts';
import { buildIndonesianNumberTokens } from './number-builder-id.js';

export interface SequenceBuilderOptions {
  baseAssetUrl?: string; // e.g. "/assets/audio/id/" or "https://cdn.example.com/audio/id/"
}

export class AudioSequenceBuilder {
  private baseAssetUrl: string;

  constructor(options: SequenceBuilderOptions = {}) {
    const base = options.baseAssetUrl !== undefined ? options.baseAssetUrl : 'assets/id/';
    this.baseAssetUrl = base === '' ? '' : (base.endsWith('/') ? base : `${base}/`);
  }

  /**
   * Build complete audio sequence for a ticket call in Indonesian
   */
  public buildCallAnnouncement(params: {
    ticketNumber: string;
    numberOnly: number;
    destinationCode?: string; // e.g. "klinik_gigi", "gigi", "umum", "klinik_umum"
    prefix?: string;
    includeClinicPhrase?: boolean;
  }): AudioAnnouncementPayload {
    const sequence: AudioSequenceItem[] = [];

    // 1. "Nomor Antrian"
    sequence.push({
      token: 'phrase:nomor_antrian',
      path: this.resolvePath('phrases/nomor_antrian.mp3'),
      text: 'Nomor Antrian',
    });

    // 1b. Prefix Letter (A - E) if provided
    if (params.prefix) {
      const cleanPrefix = params.prefix.trim().toLowerCase();
      sequence.push({
        token: `letter:${cleanPrefix}`,
        path: this.resolvePath(`letters/${cleanPrefix}.mp3`),
        text: cleanPrefix.toUpperCase(),
      });
    }

    // 2. Numbers (1 - 999)
    const numberTokens = buildIndonesianNumberTokens(params.numberOnly);
    for (const item of numberTokens) {
      sequence.push({
        token: item.token,
        path: this.resolvePath(item.path),
      });
    }

    // 3. "Silakan Menuju"
    sequence.push({
      token: 'phrase:silakan_menuju',
      path: this.resolvePath('phrases/silakan_menuju.mp3'),
      text: 'Silahkan Menuju',
    });

    // 3b. Optional "Ke Klinik" phrase
    if (params.includeClinicPhrase) {
      sequence.push({
        token: 'phrase:ke_klinik',
        path: this.resolvePath('phrases/ke_klinik.mp3'),
        text: 'Ke Klinik',
      });
    }

    // 4. Destination (e.g. Klinik Gigi, Gigi, Umum)
    const dest = params.destinationCode || 'klinik_gigi';
    sequence.push({
      token: `dest:${dest}`,
      path: this.resolvePath(`destinations/${dest}.mp3`),
      text: dest.replace(/_/g, ' '),
    });

    return {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ticketId: params.ticketNumber,
      ticketNumber: params.ticketNumber,
      destination: dest,
      language: 'id-ID',
      sequence,
      repeatCount: 1,
    };
  }

  private resolvePath(subPath: string): string {
    return `${this.baseAssetUrl}${subPath}`;
  }
}
