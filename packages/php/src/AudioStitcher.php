<?php

declare(strict_types=1);

namespace AntrianKit;

class AudioStitcher
{
    private string $baseAssetDir;

    public function __construct(string $baseAssetDir)
    {
        $this->baseAssetDir = rtrim($baseAssetDir, '/\\');
    }

    /**
     * Extracts raw MP3 audio frames by stripping ID3v2 header and ID3v1 trailer.
     */
    public static function extractMp3Frames(string $data): string
    {
        $len = strlen($data);
        $start = 0;

        // Check ID3v2: "ID3"
        if ($len >= 10 && substr($data, 0, 3) === 'ID3') {
            $b6 = ord($data[6]) & 0x7f;
            $b7 = ord($data[7]) & 0x7f;
            $b8 = ord($data[8]) & 0x7f;
            $b9 = ord($data[9]) & 0x7f;
            $tagSize = ($b6 << 21) | ($b7 << 14) | ($b8 << 7) | $b9;
            $start = 10 + $tagSize;
        }

        $end = $len;
        // Check ID3v1: last 128 bytes start with "TAG"
        if ($len >= 128 && substr($data, -128, 3) === 'TAG') {
            $end = $len - 128;
        }

        if ($start >= $end) {
            return $data;
        }

        return substr($data, $start, $end - $start);
    }

    /**
     * Stitches sequence of audio items or relative paths into single MP3 binary string.
     *
     * @param array<array{path: string}|string> $items
     * @return string Raw MP3 bytes
     */
    public function stitch(array $items): string
    {
        $combined = '';
        foreach ($items as $item) {
            $rel = is_array($item) ? ($item['path'] ?? '') : (string)$item;
            $full = ($rel[0] === '/' || (strlen($rel) > 2 && $rel[1] === ':'))
                ? $rel
                : $this->baseAssetDir . DIRECTORY_SEPARATOR . $rel;

            if (!file_exists($full)) {
                throw new \RuntimeException("File audio tidak ditemukan: {$full}");
            }

            $raw = file_get_contents($full);
            if ($raw === false) {
                throw new \RuntimeException("Gagal membaca file: {$full}");
            }

            $combined .= self::extractMp3Frames($raw);
        }

        return $combined;
    }

    /**
     * Stitches an announcement payload array directly.
     */
    public function stitchAnnouncement(array $announcement): string
    {
        return $this->stitch($announcement['sequence'] ?? []);
    }

    /**
     * Returns Base64 Data URL for HTML5 <audio> tag.
     */
    public function toBase64(array $items): string
    {
        $raw = $this->stitch($items);
        return 'data:audio/mpeg;base64,' . base64_encode($raw);
    }

    /**
     * Saves merged MP3 binary to a file on disk.
     */
    public function saveToFile(array $items, string $outPath): void
    {
        $raw = $this->stitch($items);
        file_put_contents($outPath, $raw);
    }
}
