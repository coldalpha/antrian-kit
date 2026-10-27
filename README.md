# Antrian Kit

Reusable Queue Calling SDK, Audio Engine, and Realtime Display for Cross-Platform Queue Management.

## Overview

`antrian-kit` adalah pustaka pemanggilan antrean modular untuk berbagai platform (Web, React/Vue, PHP/Laravel, Desktop). Sistem dirancang agar pengembang tidak perlu membuat ulang aset suara, logika perakitan antrean audio, serta sinkronisasi display di setiap aplikasi.

## Modular Packages (Roadmap)

- **`contracts`**: Definisi tipe data antrean, state machine, dan event schema.
- **`core`**: Logika state antrean murni (`WAITING` -> `CALLED` -> `SERVING` -> `COMPLETED`/`SKIPPED`).
- **`audio`**: Audio speech engine untuk perakitan ucapan nomor, antrean suara, dan kontrol playback.
- **`sdk`**: Client HTTP dan event subscriber (SSE / WebSocket).
- **`apps/api`**: REST API backend terpusat untuk antrean.
- **`adapters`**: Adapter Laravel, React, Vue, dan Electron.

## Multi-Language Packages

`antrian-kit` mendukung 4 ekosistem runtime dengan API dan output yang identik:

- **Node.js / TypeScript**: `packages/audio` & `packages/core` (ESM / npm).
- **PHP**: `packages/php` (Composer `coldalpha/antrian-kit`, PHP 7.4 - 8.3).
- **Go**: `packages/go` (Go Module `github.com/coldalpha/antrian-kit/packages/go`, Go 1.21+).
- **Java**: `packages/java` (Maven `dev.coldalpha:antrian-kit`, Java 17+).

## Audio Stitcher (Gapless Merge)

Untuk menghindari jeda/tersendat saat memutar file audio terpisah di browser/loket, semua SDK dilengkapi dengan **`AudioStitcher`**:
1. Menghapus header metadata ID3v2/ID3v1 secara otomatis.
2. Menggabungkan raw MP3 audio frames langsung menjadi **1 file/stream MP3 utuh yang halus dan tidak bersambung-sambung**.
3. Mendukung ekspor ke **Buffer / byte array**, file MP3 langsung, atau string **Base64 Data URI** (`data:audio/mpeg;base64,...`) siap pakai di tag `<audio src="...">` frontend.

## Audio Assets (`id-ID`)

Aset suara Bahasa Indonesia tersimpan di `packages/audio/assets/id/`:
- **`bells/`**: `bell.mp3` (ting tung chime pembuka).
- **`letters/`**: `a.mp3` - `e.mp3` (prefix antrean).
- **`numbers/`**: `1.mp3` - `11.mp3`, `belas.mp3`, `puluh.mp3`, `seratus.mp3`, `ratus.mp3`, `ribu.mp3`.
- **`phrases/`**: `nomor_antrian.mp3`, `silakan_menuju.mp3`, `ke_klinik.mp3`.
- **`destinations/`**: `gigi.mp3`, `umum.mp3`, `klinik_gigi.mp3`, `klinik_umum.mp3`.

## License

MIT License.
