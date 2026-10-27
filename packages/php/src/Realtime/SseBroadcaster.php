<?php

declare(strict_types=1);

namespace AntrianKit\Realtime;

class SseBroadcaster
{
    private string $storageFile;

    public function __construct(?string $storageFile = null)
    {
        $this->storageFile = $storageFile ?? sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'antrian_events.json';
    }

    /**
     * Publish a new queue event to the broadcast log
     *
     * @param array $event
     * @return void
     */
    public function publish(array $event): void
    {
        $event['timestamp'] = round(microtime(true) * 1000);

        $events = $this->readEvents();
        $events[] = $event;

        // Keep last 30 events only
        if (count($events) > 30) {
            $events = array_slice($events, -30);
        }

        @file_put_contents($this->storageFile, json_encode($events), LOCK_EX);
    }

    /**
     * Start streaming Server-Sent Events (SSE) to connected HTTP clients
     *
     * @param int $timeoutSeconds Maximum duration per connection (default 30s for PHP workers)
     * @return void
     */
    public function stream(int $timeoutSeconds = 30): void
    {
        if (ob_get_level() > 0) {
            @ob_end_clean();
        }

        header('Content-Type: text/event-stream; charset=utf-8');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no'); // Disable Nginx proxy buffering

        $lastSentTime = round(microtime(true) * 1000) - 2000;
        $startTime = time();

        // Send initial heartbeat
        echo ": ping\n\n";
        @flush();

        while (true) {
            if (connection_aborted() || (time() - $startTime) >= $timeoutSeconds) {
                break;
            }

            $events = $this->readEvents();
            foreach ($events as $ev) {
                $evTime = $ev['timestamp'] ?? 0;
                if ($evTime > $lastSentTime) {
                    echo "data: " . json_encode($ev) . "\n\n";
                    $lastSentTime = $evTime;
                    @flush();
                }
            }

            // Send heartbeat ping every 10 iterations (2.5 seconds)
            static $iter = 0;
            $iter++;
            if ($iter % 10 === 0) {
                echo ": ping\n\n";
                @flush();
            }

            usleep(250000); // 250ms check interval
        }
    }

    /**
     * @return array
     */
    private function readEvents(): array
    {
        if (!file_exists($this->storageFile)) {
            return [];
        }

        $raw = @file_get_contents($this->storageFile);
        if (!$raw) {
            return [];
        }

        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }
}
