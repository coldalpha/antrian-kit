<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/NumberBuilderId.php';
require_once __DIR__ . '/../src/SequenceBuilder.php';
require_once __DIR__ . '/../src/AudioStitcher.php';
require_once __DIR__ . '/../src/Display.php';
require_once __DIR__ . '/../src/Realtime/SseBroadcaster.php';
require_once __DIR__ . '/../src/AntrianKit.php';

use AntrianKit\NumberBuilderId;
use AntrianKit\SequenceBuilder;
use AntrianKit\AudioStitcher;
use AntrianKit\Display;
use AntrianKit\AntrianKit;

echo "Running AntrianKit PHP tests...\n";

// 1. NumberBuilderId test
$tokens1 = NumberBuilderId::build(1);
assert(count($tokens1) === 1 && $tokens1[0]['token'] === 'num:1');

$tokens125 = NumberBuilderId::build(125);
assert(count($tokens125) === 4);
assert($tokens125[0]['token'] === 'num:seratus');
assert($tokens125[1]['token'] === 'num:2');
assert($tokens125[2]['token'] === 'num:puluh');
assert($tokens125[3]['token'] === 'num:5');
echo "✓ NumberBuilderId tests passed\n";

// 2. SequenceBuilder test
$seqBuilder = new SequenceBuilder();
$ann = $seqBuilder->build([
    'ticketNumber' => 'B-125',
    'numberOnly' => 125,
    'prefix' => 'B',
    'destinationCode' => 'umum',
    'includeClinicPhrase' => true,
    'bellChime' => true,
]);

assert($ann['ticketNumber'] === 'B-125');
assert($ann['bellChime'] === true);
assert($ann['sequence'][0]['token'] === 'bell:chime');
assert($ann['sequence'][1]['token'] === 'phrase:nomor_antrian');
assert($ann['sequence'][2]['token'] === 'letter:b');
assert($ann['sequence'][3]['token'] === 'num:seratus');
assert($ann['sequence'][count($ann['sequence']) - 1]['token'] === 'dest:umum');
echo "✓ SequenceBuilder tests passed\n";

// 3. AudioStitcher test
$assetsDir = realpath(__DIR__ . '/../../audio/assets/id');
assert($assetsDir !== false && is_dir($assetsDir));

$stitcher = new AudioStitcher($assetsDir);
$mp3 = $stitcher->stitchAnnouncement($ann);

assert(strlen($mp3) > 50000, "Stitched MP3 size must be substantial");
assert(ord($mp3[0]) === 0xff, "First byte of stitched MP3 must be frame sync 0xFF");

$b64 = $stitcher->toBase64($ann['sequence']);
assert(str_starts_with($b64, 'data:audio/mpeg;base64,'));
echo "✓ AudioStitcher tests passed (merged size: " . strlen($mp3) . " bytes)\n";

// 4. Display view render test
$html = Display::render([
    'clinic_name' => 'RSUD Batang',
    'stream_url' => '/antrian/stream',
    'running_text' => 'Selamat datang di RSUD Batang',
]);
assert(str_contains($html, 'RSUD Batang'));
assert(str_contains($html, '/antrian/stream'));
assert(str_contains($html, 'Display Antrean Siap'));
echo "✓ Display render tests passed\n";

// 5. AntrianKit Facade and Broadcast test
$callResult = AntrianKit::broadcastCall([
    'ticketNumber' => 'A-001',
    'numberOnly' => 1,
    'prefix' => 'A',
    'destinationCode' => 'klinik_umum',
    'destinationLabel' => 'Poli Umum',
    'bellChime' => true,
    'waiting' => ['A-002', 'A-003', 'B-001'],
]);

assert($callResult['type'] === 'call');
assert($callResult['ticketNumber'] === 'A-001');
assert(str_starts_with($callResult['audio'], 'data:audio/mpeg;base64,'));
assert(count($callResult['waiting']) === 3);
echo "✓ AntrianKit broadcastCall tests passed\n";

echo "ALL PHP TESTS PASSED!\n";
