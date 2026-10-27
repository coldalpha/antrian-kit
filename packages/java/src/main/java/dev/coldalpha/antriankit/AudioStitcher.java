package dev.coldalpha.antriankit;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Base64;
import java.util.List;

public class AudioStitcher {
    private final String baseAssetDir;

    public AudioStitcher(String baseAssetDir) {
        this.baseAssetDir = baseAssetDir == null ? "" : baseAssetDir.replaceAll("[/\\\\]+$", "");
    }

    /**
     * Extracts raw MP3 audio frames by stripping ID3v2 header and ID3v1 trailer.
     */
    public static byte[] extractMp3Frames(byte[] data) {
        int length = data.length;
        int start = 0;

        // Check ID3v2: "ID3"
        if (length >= 10 && data[0] == 'I' && data[1] == 'D' && data[2] == '3') {
            int b6 = data[6] & 0x7f;
            int b7 = data[7] & 0x7f;
            int b8 = data[8] & 0x7f;
            int b9 = data[9] & 0x7f;
            int tagSize = (b6 << 21) | (b7 << 14) | (b8 << 7) | b9;
            start = 10 + tagSize;
        }

        int end = length;
        // Check ID3v1: last 128 bytes start with "TAG"
        if (length >= 128 && data[length - 128] == 'T' && data[length - 127] == 'A' && data[length - 126] == 'G') {
            end = length - 128;
        }

        if (start >= end || start >= length) {
            return data;
        }

        byte[] result = new byte[end - start];
        System.arraycopy(data, start, result, 0, end - start);
        return result;
    }

    /**
     * Stitches sequence of audio items into a single MP3 byte array.
     */
    public byte[] stitch(List<AudioSequenceItem> items) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        for (AudioSequenceItem item : items) {
            String rel = item.getPath();
            File file = new File(rel).isAbsolute()
                    ? new File(rel)
                    : new File(baseAssetDir, rel);

            if (!file.exists()) {
                throw new IOException("File audio tidak ditemukan: " + file.getAbsolutePath());
            }

            byte[] raw = Files.readAllBytes(file.toPath());
            byte[] frames = extractMp3Frames(raw);
            baos.write(frames);
        }

        return baos.toByteArray();
    }

    /**
     * Convenience method for announcement payload.
     */
    public byte[] stitchAnnouncement(AudioAnnouncementPayload payload) throws IOException {
        return stitch(payload.getSequence());
    }

    /**
     * Returns Base64 Data URL for HTML5 <audio> tag.
     */
    public String toBase64(List<AudioSequenceItem> items) throws IOException {
        byte[] raw = stitch(items);
        return "data:audio/mpeg;base64," + Base64.getEncoder().encodeToString(raw);
    }

    /**
     * Saves merged MP3 binary to disk.
     */
    public void saveToFile(List<AudioSequenceItem> items, File outFile) throws IOException {
        byte[] raw = stitch(items);
        Files.write(outFile.toPath(), raw);
    }
}
