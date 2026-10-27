<?php

declare(strict_types=1);

namespace AntrianKit;

class Display
{
    /**
     * Render the Realtime TV Queue Display HTML
     *
     * @param array{
     *   clinic_name?: string,
     *   stream_url?: string,
     *   running_text?: string
     * } $options
     * @return string
     */
    public static function render(array $options = []): string
    {
        $templatePath = __DIR__ . '/../resources/views/display.html';

        if (!file_exists($templatePath)) {
            throw new \RuntimeException("Template view tidak ditemukan di: {$templatePath}");
        }

        $html = file_get_contents($templatePath);

        $clinicName = $options['clinic_name'] ?? 'Klinik / Fasilitas Kesehatan';
        $streamUrl = $options['stream_url'] ?? '/antrian/stream';
        $runningText = $options['running_text'] ?? 'Selamat Datang. Harap memperhatikan nomor antrean dan menuju ke loket atau ruangan yang ditentukan.';

        $html = str_replace(
            ['{{CLINIC_NAME}}', '{{STREAM_URL}}', '{{RUNNING_TEXT}}'],
            [htmlspecialchars($clinicName, ENT_QUOTES, 'UTF-8'), htmlspecialchars($streamUrl, ENT_QUOTES, 'UTF-8'), htmlspecialchars($runningText, ENT_QUOTES, 'UTF-8')],
            $html
        );

        return $html;
    }
}
