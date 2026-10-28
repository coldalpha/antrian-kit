<?php

declare(strict_types=1);

namespace AntrianKit\Laravel;

use AntrianKit\AntrianKit;

class AntrianController
{
    /**
     * Show Realtime TV Queue Display
     */
    public function display()
    {
        $clinicName = config('antrian-kit.clinic_name', config('app.name', 'KLINIK MANDIRI'));
        $runningText = config('antrian-kit.running_text', 'Selamat datang di fasilitas kesehatan kami. Harap memperhatikan nomor antrean dan menuju ke ruangan yang ditentukan.');

        if (class_exists(\App\Models\Setting::class)) {
            try {
                $setting = \App\Models\Setting::getSetting();
                if (!empty($setting->nama_instansi)) {
                    $clinicName = $setting->nama_instansi;
                }
                if (!empty($setting->tagline)) {
                    $runningText = $setting->nama_instansi . ' - ' . $setting->tagline . '. ' . $runningText;
                }
            } catch (\Throwable $e) {}
        }

        $streamUrl = config('antrian-kit.stream_url', url('/antrian/stream'));

        $html = AntrianKit::renderDisplay([
            'clinic_name' => $clinicName,
            'stream_url' => $streamUrl,
            'running_text' => $runningText,
        ]);

        return response($html)->header('Content-Type', 'text/html; charset=utf-8');
    }

    /**
     * Server-Sent Events stream for TV Display
     */
    public function stream()
    {
        return response()->stream(function () {
            AntrianKit::streamEvents(25);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
