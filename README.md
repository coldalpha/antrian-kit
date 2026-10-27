# Antrian Kit

SDK dan pustaka pemanggilan antrean modular, gapless audio speech engine, serta dashboard display TV realtime untuk berbagai platform (**PHP/Laravel, Go, Node.js, Java, dan Web Murni**).

---

## 🚀 Coba Demo Langsung (Quickstart)

Anda bisa langsung menjalankan dan menguji sistem antrean di komputer lokal dalam 1 menit:

### Opsi A: PHP Native (Tanpa Setup DB)
```bash
git clone https://github.com/coldalpha/antrian-kit.git
cd antrian-kit
php -S localhost:8080 -t examples/php-native
```
Buka browser:
- **Panel Loket Pemanggil**: `http://localhost:8080`
- **Layar TV Display**: `http://localhost:8080/?action=display`

### Opsi B: Go Server
```bash
git clone https://github.com/coldalpha/antrian-kit.git
cd antrian-kit/examples/go
go run main.go
```
Buka browser:
- **Panel Loket Pemanggil**: `http://localhost:8088`
- **Layar TV Display**: `http://localhost:8088/antrian/display`

### Opsi C: Browser Langsung (Tanpa Server / Static HTML)
Cukup buka file `demo/index.html` langsung dengan browser apa saja, atau jalankan:
```bash
npx serve demo
```

---

## Fitur Utama

- **Gapless Audio Stitcher**: Otomatis memotong metadata ID3v2/ID3v1 dan menggabungkan raw MPEG frames menjadi **1 file / stream MP3 utuh**. Suara panggilan mengalir halus (*soft*) tanpa jeda atau tersendat antar kata.
- **Realtime TV Display (SSE)**: Dashboard layar monitor/TV ruang tunggu interaktif berbasis Server-Sent Events (SSE). Dilengkapi jam realtime WIB, daftar antrean menunggu, riwayat panggilan, animasi kedip kartu aktif, serta pemutar suara otomatis.
- **Zero Heavy Dependencies**: Tidak memerlukan Pusher API, Node.js background worker, ataupun Redis tambahan. Berjalan langsung dengan standar PHP / Laravel dan Go HTTP.
- **Aset Suara Bahasa Indonesia Lengkap**: Prefix huruf (A-E), angka 1-999 (termasuk belas, puluh, seratus, ratus), bel pembuka *ting-tung*, dan frasa klinik/loket.

---

## 1. Penggunaan di PHP & Laravel

### A. Instalasi via Composer (Laravel)

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

*(Setelah dipublikasikan ke Packagist, cukup `composer require coldalpha/antrian-kit`)*

#### Konfigurasi & Asset Publishing (Opsional)
Service provider terdaftar otomatis via Package Auto-Discovery. Anda dapat mem-publish file konfigurasi dan aset:

```bash
php artisan vendor:publish --tag=antrian-kit-config
php artisan vendor:publish --tag=antrian-kit-assets
```

#### Memanggil Antrean & Menyiarkan ke Layar TV
Di Controller loket/pendaftaran Anda:

```php
use AntrianKit\AntrianKit;

class LoketController extends Controller
{
    public function panggil(Request $request)
    {
        // Panggil dan siarkan langsung ke layar TV display via SSE
        $event = AntrianKit::broadcastCall([
            'ticketNumber'        => 'A-012',
            'numberOnly'          => 12,
            'prefix'              => 'A',
            'destinationCode'     => 'klinik_umum', // 'klinik_gigi', 'umum', 'gigi'
            'destinationLabel'    => 'Poli Umum',
            'includeClinicPhrase' => false,
            'bellChime'           => true,
            'waiting'             => ['A-013', 'A-014', 'B-001'], // Daftar antrean menunggu
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Panggilan disiarkan',
            'event'   => $event
        ]);
    }
}
```

#### Membuka Layar TV Display
Buka URL bawaan antrian-kit di layar TV monitor ruang tunggu:
```
http://localhost:8000/antrian/display
```
Klik tombol **"Mulai Display & Suara"** satu kali saat pertama kali membuka layar agar browser mengizinkan audio berbunyi otomatis (*browser autoplay policy*).

---

### B. Penggunaan di PHP Native (Tanpa Framework)

Jika Anda memakai PHP murni atau aplikasi lama:

```php
require_once 'path/to/antrian-kit/packages/php/src/AntrianKit.php';
// Include file pendukung atau gunakan composer autoload

use AntrianKit\AntrianKit;

AntrianKit::setAssetPath('path/to/antrian-kit/packages/audio/assets/id');

// Menghasilkan audio Base64 untuk disetel di frontend
$result = AntrianKit::buildCallAudio([
    'ticketNumber'    => 'B-025',
    'numberOnly'      => 25,
    'prefix'          => 'B',
    'destinationCode' => 'klinik_gigi',
    'bellChime'       => true,
]);

$audioBase64 = $result['audio']; // "data:audio/mpeg;base64,..."
```

---

## 2. Penggunaan di Go

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

	// 1. Endpoint Tampilan TV Display (HTML tertanam dalam binary)
	http.HandleFunc("/antrian/display", hub.DisplayHandler())

	// 2. Endpoint Realtime Server-Sent Events (SSE)
	http.HandleFunc("/antrian/stream", hub.EventsHandler())

	// 3. Endpoint Pemanggilan Antrean oleh Petugas Loket
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

## 3. Penggunaan di Frontend Web Murni (JavaScript / Browser)

Anda juga dapat menggabungkan file audio langsung di sisi browser pasien/loket tanpa melibatkan proses backend:

```javascript
// Menggabungkan potongan audio menjadi 1 Blob MP3 langsung di browser
async function playQueueCall(audioUrls) {
  const chunks = [];
  for (const url of audioUrls) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    // Potong header ID3 tag (10 byte + size)
    chunks.push(stripId3(new Uint8Array(buf)));
  }

  // Gabungkan array bytes
  const mergedBlob = new Blob(chunks, { type: 'audio/mpeg' });
  const audio = new Audio(URL.createObjectURL(mergedBlob));
  await audio.play();
}
```
*(Contoh implementasi lengkap tersedia di `demo/index.html`)*.

---

## 4. Struktur Package & Bahasa

| Bahasa | Direktori | Target / Manfaat |
|---|---|---|
| **PHP / Laravel** | `packages/php` | Composer package, Auto-Discovery Provider, SseBroadcaster, Display View |
| **Go** | `packages/go` | In-memory SSE Hub, Embedded TV HTML (`//go:embed`), High Concurrency |
| **Node.js** | `packages/core` & `packages/audio` | TypeScript ESM, State Machine Antrean, AudioStitcher Buffer/Base64 |
| **Java** | `packages/java` | Maven artifact, NumberBuilder, SequenceBuilder, AudioStitcher |
| **Demo & Contoh** | `examples/` & `demo/` | Siap jalan dalam 1 perintah untuk uji coba langsung |

---

## 5. Cara Kerja AudioStitcher (Gapless Audio)

Ketika memutar potongan file audio terpisah di browser secara berurutan (`audio1.play() -> onended -> audio2.play()`), browser mengalami *decoding & initialization latency* sekitar 50ms - 200ms di antara setiap file, menyebabkan suara tersendat-sendat (*robotic*).

**Solusi AntrianKit:**
1. Membaca binary stream dari setiap potongan kata MP3.
2. Memangkas (*strip*) frame header metadata ID3v2 dan trailer ID3v1 secara otomatis.
3. Menggabungkan raw MPEG Layer III frames secara bitwise berurutan.
4. Menghasilkan stream MP3 murni dalam bentuk Base64 Data URL (`data:audio/mpeg;base64,...`) yang disetel langsung ke satu elemen `<audio>`. Suara terdengar lembut dan mengalir alami seperti satu rekaman utuh.

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
