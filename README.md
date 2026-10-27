# Antrian Kit

SDK dan pustaka pemanggilan antrean modular, gapless audio speech engine, serta dashboard display TV realtime untuk berbagai platform (PHP/Laravel, Go, Node.js, Java).

---

## Fitur Utama

- **Gapless Audio Stitcher**: Otomatis potong metadata ID3v2/ID3v1 dan gabungkan MP3 frames menjadi **1 file / stream MP3 tunggal**. Suara panggilan mengalir halus (*soft*) tanpa jeda atau tersendat.
- **Realtime TV Display (SSE)**: Dashboard layar monitor/TV ruang tunggu interaktif berbasis Server-Sent Events (SSE). Dilengkapi jam realtime WIB, daftar antrean menunggu, riwayat panggilan, animasi kedip kartu aktif, serta pemutar suara otomatis.
- **Zero Heavy Dependencies**: Tidak membutuhkan Pusher API, Node.js background process, ataupun Redis tambahan. Berjalan langsung dengan standar PHP / Laravel dan Go HTTP.
- **Aset Suara Bahasa Indonesia Lengkap**: Prefix huruf (A-E), angka 1-999 (termasuk belas, puluh, seratus, ratus), bel pembuka *ting-tung*, dan frasa klinik/loket.

---

## 1. Instalasi & Penggunaan di PHP / Laravel

### Instalasi via Composer

Tambahkan repositori ke file `composer.json` project Laravel Anda:

```json
"repositories": [
  {
    "type": "vcs",
    "url": "https://github.com/coldalpha/antrian-kit.git"
  }
]
```

Kemudian jalankan:

```bash
composer require coldalpha/antrian-kit:dev-main
```

*(Jika sudah dipublikasikan ke Packagist, cukup `composer require coldalpha/antrian-kit`)*

### Konfigurasi Laravel (Opsional)

Service provider terdaftar otomatis via Package Auto-Discovery. Anda dapat mem-publish file konfigurasi dan aset:

```bash
php artisan vendor:publish --tag=antrian-kit-config
php artisan vendor:publish --tag=antrian-kit-assets
```

File konfigurasi akan tersedia di `config/antrian-kit.php`.

### Memanggil Antrean & Siarkan ke TV Display

Di Controller loket/pendaftaran Anda:

```php
use AntrianKit\AntrianKit;

class LoketController extends Controller
{
    public function panggil(Request $request)
    {
        // 1. Panggil dan siarkan langsung ke layar TV display
        $event = AntrianKit::broadcastCall([
            'ticketNumber'        => 'A-012',
            'numberOnly'          => 12,
            'prefix'              => 'A',
            'destinationCode'     => 'klinik_umum', // 'klinik_gigi', 'umum', 'gigi'
            'destinationLabel'    => 'Poli Umum',
            'includeClinicPhrase' => false,
            'bellChime'           => true,
            'waiting'             => ['A-013', 'A-014', 'B-001'], // Antrean menunggu
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Panggilan disiarkan',
            'event'   => $event
        ]);
    }
}
```

### Membuka TV Display di Browser / Layar Monitor

Buka URL bawaan antrian-kit di layar TV ruang tunggu:
```
http://localhost:8000/antrian/display
```
Klik tombol **"Mulai Display & Suara"** satu kali saat pertama kali membuka layar agar browser mengizinkan audio berbunyi otomatis (*autoplay policy*).

### Menghasilkan Audio Base64 Saja (Tanpa SSE)

Jika Anda ingin memutar suara langsung di komputer loket pemanggil:

```php
use AntrianKit\AntrianKit;

$result = AntrianKit::buildCallAudio([
    'ticketNumber' => 'B-025',
    'numberOnly'   => 25,
    'prefix'       => 'B',
    'destinationCode' => 'klinik_gigi',
    'bellChime'    => true,
]);

// String audio siap dipasang di tag HTML <audio src="...">
$audioBase64 = $result['audio']; // "data:audio/mpeg;base64,..."
```

---

## 2. Instalasi & Penggunaan di Go

### Instalasi Module

```bash
go get github.com/coldalpha/antrian-kit/packages/go
```

### Standalone Server Display & Panggilan Antrean

```go
package main

import (
	"log"
	"net/http"

	antriankit "github.com/coldalpha/antrian-kit/packages/go"
)

func main() {
	assetsDir := "./packages/audio/assets/id"

	hub := antriankit.NewDisplayHub(assetsDir, antriankit.DisplayConfig{
		ClinicName:  "RSUD Batang",
		StreamURL:   "/antrian/stream",
		RunningText: "Selamat datang di RSUD Batang. Mohon tertib menunggu giliran.",
	})

	// 1. Endpoint Tampilan TV Display
	http.HandleFunc("/antrian/display", hub.DisplayHandler())

	// 2. Endpoint Realtime Server-Sent Events (SSE)
	http.HandleFunc("/antrian/stream", hub.EventsHandler())

	// 3. Endpoint Pemanggilan Antrean oleh Petugas
	http.HandleFunc("/antrian/panggil", func(w http.ResponseWriter, r *http.Request) {
		ev, err := hub.BroadcastCall(antriankit.CallParams{
			TicketNumber:        "A-001",
			NumberOnly:          1,
			Prefix:              "A",
			DestinationCode:     "klinik_umum",
			IncludeClinicPhrase: false,
			BellChime:           true,
		}, []string{"A-002", "A-003"})

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Panggilan terkirim: " + ev.TicketNumber))
	})

	log.Println("Server antrean berjalan di http://localhost:8080/antrian/display")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

---

## 3. Ekosistem Multi-Bahasa

| Bahasa | Lokasi Package | Fitur Utama |
|---|---|---|
| **PHP / Laravel** | `packages/php` | Composer package, Auto-Discovery Provider, SseBroadcaster, Display View |
| **Go** | `packages/go` | Go module, In-memory SSE Hub, Embedded TV HTML template (`//go:embed`) |
| **Node.js** | `packages/core` & `packages/audio` | TypeScript ESM, State Machine Antrean, AudioStitcher Buffer/Base64 |
| **Java** | `packages/java` | Maven artifact, NumberBuilder, SequenceBuilder, AudioStitcher |

---

## 4. Cara Kerja AudioStitcher (Gapless Audio)

Ketika memutar potongan file audio terpisah di browser (`file1.play() -> onended -> file2.play()`), peramban mengalami *decoding latency* sekitar 50ms - 200ms di antara setiap file, menyebabkan suara tersendat-sendat.

**Solusi AntrianKit:**
1. Membaca binary dari setiap file audio MP3.
2. Memangkas (*strip*) frame header ID3v2 (10 byte + syncsafe size) dan trailer ID3v1 (128 byte).
3. Menggabungkan raw MPEG-1 Audio Layer III frames secara bitwise.
4. Menghasilkan stream MP3 murni dalam bentuk Base64 Data URL (`data:audio/mpeg;base64,...`) yang disetel langsung ke satu elemen `<audio>`. Suara terdengar mengalir seperti rekaman utuh.

---

## Aset Suara (`packages/audio/assets/id`)

- **Bells**: `bells/bell.mp3` (ting-tung chime, 44.1 kHz).
- **Huruf**: `letters/a.mp3` s/d `letters/e.mp3`.
- **Angka**: `numbers/1.mp3` s/d `11.mp3`, `belas.mp3`, `puluh.mp3`, `seratus.mp3`, `ratus.mp3`, `ribu.mp3`.
- **Frasa**: `phrases/nomor_antrian.mp3`, `phrases/silakan_menuju.mp3`, `phrases/ke_klinik.mp3`.
- **Destinasi**: `destinations/klinik_umum.mp3`, `destinations/klinik_gigi.mp3`, `destinations/umum.mp3`, `destinations/gigi.mp3`.

---

## Lisensi

[MIT License](LICENSE) - Dibuat oleh [coldalpha](https://coldalpha.dev).
