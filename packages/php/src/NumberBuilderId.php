<?php

declare(strict_types=1);

namespace AntrianKit;

class NumberBuilderId
{
    /**
     * Maps integer (1 - 999) to sequence of relative MP3 paths
     *
     * @param int $num
     * @return array<array{token: string, path: string}>
     */
    public static function build(int $num): array
    {
        if ($num < 1 || $num > 999) {
            throw new \InvalidArgumentException("Nomor antrean di luar jangkauan (1 - 999): {$num}");
        }

        if ($num <= 11) {
            return [
                ['token' => "num:{$num}", 'path' => "numbers/{$num}.mp3"]
            ];
        }

        if ($num >= 12 && $num <= 19) {
            $satuan = $num - 10;
            return [
                ['token' => "num:{$satuan}", 'path' => "numbers/{$satuan}.mp3"],
                ['token' => 'num:belas', 'path' => 'numbers/belas.mp3']
            ];
        }

        if ($num <= 99) {
            $puluhan = intdiv($num, 10);
            $sisa = $num % 10;
            $tokens = [
                ['token' => "num:{$puluhan}", 'path' => "numbers/{$puluhan}.mp3"],
                ['token' => 'num:puluh', 'path' => 'numbers/puluh.mp3']
            ];
            if ($sisa > 0) {
                $tokens[] = ['token' => "num:{$sisa}", 'path' => "numbers/{$sisa}.mp3"];
            }
            return $tokens;
        }

        if ($num <= 199) {
            $tokens = [
                ['token' => 'num:seratus', 'path' => 'numbers/seratus.mp3']
            ];
            $sisa = $num - 100;
            if ($sisa > 0) {
                $tokens = array_merge($tokens, self::build($sisa));
            }
            return $tokens;
        }

        $ratusan = intdiv($num, 100);
        $sisa = $num % 100;
        $tokens = [
            ['token' => "num:{$ratusan}", 'path' => "numbers/{$ratusan}.mp3"],
            ['token' => 'num:ratus', 'path' => 'numbers/ratus.mp3']
        ];
        if ($sisa > 0) {
            $tokens = array_merge($tokens, self::build($sisa));
        }
        return $tokens;
    }
}
