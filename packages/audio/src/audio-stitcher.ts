import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AudioAnnouncementPayload, AudioSequenceItem } from '@antrian-kit/contracts';

export interface AudioStitcherOptions {
  baseAssetDir: string;
}

/**
 * AudioStitcher merges multiple normalized MP3 audio assets into a single gapless MP3 stream/buffer.
 */
export class AudioStitcher {
  private baseAssetDir: string;

  constructor(options: AudioStitcherOptions) {
    this.baseAssetDir = options.baseAssetDir;
  }

  /**
   * Extracts raw MP3 audio frames by stripping ID3v2 header and ID3v1 trailer.
   */
  public static extractMp3Frames(buffer: Buffer): Buffer {
    let start = 0;

    // Check ID3v2 header: "ID3" (0x49, 0x44, 0x33)
    if (buffer.length >= 10 && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      const b6 = buffer[6] & 0x7f;
      const b7 = buffer[7] & 0x7f;
      const b8 = buffer[8] & 0x7f;
      const b9 = buffer[9] & 0x7f;
      const tagSize = (b6 << 21) | (b7 << 14) | (b8 << 7) | b9;
      start = 10 + tagSize;
    }

    let end = buffer.length;

    // Check ID3v1 trailer: 128 bytes starting with "TAG" (0x54, 0x41, 0x47)
    if (buffer.length >= 128) {
      const tagOffset = buffer.length - 128;
      if (buffer[tagOffset] === 0x54 && buffer[tagOffset + 1] === 0x41 && buffer[tagOffset + 2] === 0x47) {
        end = tagOffset;
      }
    }

    if (start >= end) {
      return buffer;
    }

    return buffer.subarray(start, end);
  }

  /**
   * Stitches sequence of audio items or relative file paths into a single MP3 Buffer.
   */
  public stitch(items: (AudioSequenceItem | string)[]): Buffer {
    const buffers: Buffer[] = [];

    for (const item of items) {
      const relPath = typeof item === 'string' ? item : item.path;
      const fullPath = path.isAbsolute(relPath) ? relPath : path.join(this.baseAssetDir, relPath);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`File audio tidak ditemukan: ${fullPath}`);
      }

      const raw = fs.readFileSync(fullPath);
      buffers.push(AudioStitcher.extractMp3Frames(raw));
    }

    return Buffer.concat(buffers);
  }

  /**
   * Convenience method to stitch an announcement payload directly.
   */
  public stitchAnnouncement(payload: AudioAnnouncementPayload): Buffer {
    return this.stitch(payload.sequence);
  }

  /**
   * Generates a base64 Data URL (data:audio/mpeg;base64,...) ready for HTML5 <audio> tag src.
   */
  public toBase64(items: (AudioSequenceItem | string)[]): string {
    const buf = this.stitch(items);
    return `data:audio/mpeg;base64,${buf.toString('base64')}`;
  }

  /**
   * Saves merged MP3 buffer to disk.
   */
  public saveToFile(items: (AudioSequenceItem | string)[], outPath: string): void {
    const buf = this.stitch(items);
    fs.writeFileSync(outPath, buf);
  }
}
