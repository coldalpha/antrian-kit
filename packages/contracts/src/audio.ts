export type AudioLanguage = 'id-ID' | 'en-US';

export interface AudioSequenceItem {
  token: string; // e.g. "phrase:nomor_antrian", "number:2", "number:puluh", "dest:klinik_gigi"
  path: string; // e.g. "phrases/nomor_antrian.mp3"
  text?: string; // Human-readable e.g. "Nomor Antrian"
}

export interface AudioAnnouncementPayload {
  id: string;
  ticketId: string;
  ticketNumber: string;
  destination: string;
  language: AudioLanguage;
  sequence: AudioSequenceItem[];
  repeatCount?: number;
  bellChime?: boolean;
}

export type AudioPlayerState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'ERROR';

export interface AudioPlaybackEvent {
  announcementId: string;
  state: AudioPlayerState;
  currentTokenIndex?: number;
  totalTokens?: number;
  error?: string;
}
