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

## Audio Assets (`id-ID`)

Aset suara Bahasa Indonesia tersimpan di `packages/audio/assets/id/`:
- **`numbers/`**: `1.mp3` - `11.mp3`, `belas.mp3`, `puluh.mp3`.
- **`phrases/`**: `nomor_antrian.mp3`, `silakan_menuju.mp3`.
- **`destinations/`**: `klinik_gigi.mp3`.

## License

MIT License.
