<?php

declare(strict_types=1);

namespace AntrianKit;

use AntrianKit\Realtime\SseBroadcaster;

class AntrianKit
{
    private static ?string $customAssetPath = null;
    private static ?SseBroadcaster $broadcaster = null;

    /**
     * Set custom audio asset directory
     */
    public static function setAssetPath(string $path): void
    {
        self::$customAssetPath = rtrim($path, '/\\');
    }

    /**
     * Get default audio asset directory
     */
    public static function getAssetPath(): string
    {
        if (self::$customAssetPath !== null && is_dir(self::$customAssetPath)) {
            return self::$customAssetPath;
        }

        // Try standard monorepo path
        $monorepoPath = realpath(__DIR__ . '/../../audio/assets/id');
        if ($monorepoPath !== false && is_dir($monorepoPath)) {
            return $monorepoPath;
        }

        // Try published package path (resources/assets/id or assets/id)
        $pkgPath = realpath(__DIR__ . '/../resources/assets/id');
        if ($pkgPath !== false && is_dir($pkgPath)) {
            return $pkgPath;
        }

        return __DIR__ . '/../../audio/assets/id';
    }

    /**
     * Build announcement sequence and return single gapless Base64 MP3 audio string
     *
     * @param array{
     *   ticketNumber: string,
     *   numberOnly: int,
     *   prefix?: string,
     *   destinationCode?: string,
     *   destinationLabel?: string,
     *   includeClinicPhrase?: bool,
     *   bellChime?: bool
     * } $params
     * @return array{payload: array, audio: string}
     */
    public static function buildCallAudio(array $params): array
    {
        $assetDir = self::getAssetPath();
        $seqBuilder = new SequenceBuilder($assetDir);
        $payload = $seqBuilder->build($params);

        $stitcher = new AudioStitcher($assetDir);
        $audioBase64 = $stitcher->toBase64($payload['sequence']);

        return [
            'payload' => $payload,
            'audio' => $audioBase64,
        ];
    }

    /**
     * Broadcast a call event to realtime display screens (via SSE)
     *
     * @param array{
     *   ticketNumber: string,
     *   numberOnly: int,
     *   prefix?: string,
     *   destinationCode?: string,
     *   destinationLabel?: string,
     *   includeClinicPhrase?: bool,
     *   bellChime?: bool,
     *   waiting?: array
     * } $params
     * @return array
     */
    public static function broadcastCall(array $params): array
    {
        $result = self::buildCallAudio($params);

        $destLabel = $params['destinationLabel'] ?? null;
        if (!$destLabel) {
            $destCode = $params['destinationCode'] ?? 'Poli Umum';
            $destLabel = ucwords(str_replace('_', ' ', $destCode));
        }

        $event = [
            'type' => 'call',
            'id' => $result['payload']['id'],
            'ticketNumber' => $params['ticketNumber'],
            'destination' => $destLabel,
            'audio' => $result['audio'],
            'waiting' => $params['waiting'] ?? [],
        ];

        self::getBroadcaster()->publish($event);

        return $event;
    }

    /**
     * Broadcast queue status update (e.g. new ticket issued, waiting list changed)
     */
    public static function broadcastQueueUpdate(array $waitingList): void
    {
        self::getBroadcaster()->publish([
            'type' => 'queue_update',
            'waiting' => $waitingList,
        ]);
    }

    /**
     * Render the Realtime TV Display HTML
     */
    public static function renderDisplay(array $options = []): string
    {
        return Display::render($options);
    }

    /**
     * Start SSE streaming loop
     */
    public static function streamEvents(int $timeoutSeconds = 30): void
    {
        self::getBroadcaster()->stream($timeoutSeconds);
    }

    /**
     * Get singleton SSE broadcaster instance
     */
    public static function getBroadcaster(): SseBroadcaster
    {
        if (self::$broadcaster === null) {
            self::$broadcaster = new SseBroadcaster();
        }
        return self::$broadcaster;
    }
}
