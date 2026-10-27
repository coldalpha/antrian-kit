<?php

declare(strict_types=1);

namespace AntrianKit;

class SequenceBuilder
{
    private string $baseAssetDir;

    public function __construct(string $baseAssetDir = '')
    {
        $this->baseAssetDir = rtrim($baseAssetDir, '/\\');
    }

    /**
     * Build announcement sequence
     *
     * @param array{
     *   ticketNumber: string,
     *   numberOnly: int,
     *   destinationCode?: string,
     *   prefix?: string,
     *   includeClinicPhrase?: bool,
     *   bellChime?: bool
     * } $params
     * @return array
     */
    public function build(array $params): array
    {
        $sequence = [];

        if (!empty($params['bellChime'])) {
            $sequence[] = [
                'token' => 'bell:chime',
                'path' => 'bells/bell.mp3',
                'text' => 'Ting Tung'
            ];
        }

        $sequence[] = [
            'token' => 'phrase:nomor_antrian',
            'path' => 'phrases/nomor_antrian.mp3',
            'text' => 'Nomor Antrian'
        ];

        if (!empty($params['prefix'])) {
            $p = strtolower(trim((string)$params['prefix']));
            $sequence[] = [
                'token' => "letter:{$p}",
                'path' => "letters/{$p}.mp3",
                'text' => strtoupper($p)
            ];
        }

        $numTokens = NumberBuilderId::build((int)$params['numberOnly']);
        foreach ($numTokens as $nt) {
            $sequence[] = $nt;
        }

        $sequence[] = [
            'token' => 'phrase:silakan_menuju',
            'path' => 'phrases/silakan_menuju.mp3',
            'text' => 'Silahkan Menuju'
        ];

        if (!empty($params['includeClinicPhrase'])) {
            $sequence[] = [
                'token' => 'phrase:ke_klinik',
                'path' => 'phrases/ke_klinik.mp3',
                'text' => 'Ke Klinik'
            ];
        }

        $dest = $params['destinationCode'] ?? 'klinik_gigi';
        $sequence[] = [
            'token' => "dest:{$dest}",
            'path' => "destinations/{$dest}.mp3",
            'text' => str_replace('_', ' ', $dest)
        ];

        return [
            'id' => 'ann_' . round(microtime(true) * 1000) . '_' . substr(md5((string)mt_rand()), 0, 4),
            'ticketNumber' => $params['ticketNumber'],
            'destination' => $dest,
            'language' => 'id-ID',
            'sequence' => $sequence,
            'bellChime' => !empty($params['bellChime'])
        ];
    }
}
