<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/NumberBuilderId.php';
require_once __DIR__ . '/../src/SequenceBuilder.php';
require_once __DIR__ . '/../src/AudioStitcher.php';

use AntrianKit\NumberBuilderId;
use AntrianKit\SequenceBuilder;
use AntrianKit\AudioStitcher;

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

echo "ALL PHP TESTS PASSED!\n";
