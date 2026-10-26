import type {
  AudioAnnouncementPayload,
  AudioPlayerState,
  AudioPlaybackEvent,
} from '@antrian-kit/contracts';

export interface AudioPlayerAdapter {
  play(src: string): Promise<void>;
  stop(): void;
}

/**
 * Headless adapter for testing and server environments
 */
export class MockAudioPlayerAdapter implements AudioPlayerAdapter {
  public playedTracks: string[] = [];
  public durationMs = 10;

  async play(src: string): Promise<void> {
    this.playedTracks.push(src);
    await new Promise((res) => setTimeout(res, this.durationMs));
  }

  stop(): void {
    // no-op
  }
}

/**
 * Browser Audio Element Adapter
 */
export class HtmlAudioPlayerAdapter implements AudioPlayerAdapter {
  private currentAudio: HTMLAudioElement | null = null;

  play(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = (err) => {
        this.currentAudio = null;
        reject(new Error(`Gagal memutar audio: ${src}`));
      };

      audio.play().catch(reject);
    });
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }
}

export class AudioQueuePlayer {
  private adapter: AudioPlayerAdapter;
  private queue: AudioAnnouncementPayload[] = [];
  private isPlaying = false;
  private state: AudioPlayerState = 'IDLE';
  private onStateChange?: (event: AudioPlaybackEvent) => void;

  constructor(
    adapter?: AudioPlayerAdapter,
    options?: { onStateChange?: (event: AudioPlaybackEvent) => void }
  ) {
    this.adapter = adapter || new MockAudioPlayerAdapter();
    this.onStateChange = options?.onStateChange;
  }

  public enqueue(announcement: AudioAnnouncementPayload): void {
    this.queue.push(announcement);
    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  public clearQueue(): void {
    this.queue = [];
    this.adapter.stop();
    this.isPlaying = false;
    this.setState('IDLE');
  }

  public getState(): AudioPlayerState {
    return this.state;
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.setState('IDLE');
      return;
    }

    this.isPlaying = true;
    const current = this.queue.shift()!;
    this.setState('PLAYING', current.id);

    try {
      const repeats = current.repeatCount && current.repeatCount > 0 ? current.repeatCount : 1;

      for (let r = 0; r < repeats; r++) {
        for (let i = 0; i < current.sequence.length; i++) {
          const item = current.sequence[i];
          this.emitEvent({
            announcementId: current.id,
            state: 'PLAYING',
            currentTokenIndex: i,
            totalTokens: current.sequence.length,
          });

          await this.adapter.play(item.path);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.setState('ERROR', current.id, errorMsg);
    } finally {
      this.processQueue();
    }
  }

  private setState(state: AudioPlayerState, announcementId = '', error?: string): void {
    this.state = state;
    this.emitEvent({
      announcementId,
      state,
      error,
    });
  }

  private emitEvent(event: AudioPlaybackEvent): void {
    if (this.onStateChange) {
      this.onStateChange(event);
    }
  }
}
