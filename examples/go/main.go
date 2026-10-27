package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"

	antriankit "github.com/coldalpha/antrian-kit/packages/go"
)

func main() {
	assetsDir, err := filepath.Abs("../../packages/audio/assets/id")
	if err != nil {
		log.Fatalf("Gagal menemukan folder audio: %v", err)
	}

	hub := antriankit.NewDisplayHub(assetsDir, antriankit.DisplayConfig{
		ClinicName:  "RSUD Batang (Go Engine)",
		StreamURL:   "/antrian/stream",
		RunningText: "Selamat datang di Antrian Kit Go Demo. Suara panggilan otomatis digabung tanpa jeda.",
	})

	// 1. Endpoint Tampilan TV Display
	http.HandleFunc("/antrian/display", hub.DisplayHandler())

	// 2. Endpoint Realtime Server-Sent Events (SSE)
	http.HandleFunc("/antrian/stream", hub.EventsHandler())

	// 3. Endpoint Panggilan Antrean (POST JSON)
	http.HandleFunc("/antrian/call", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Metode harus POST", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Ticket string `json:"ticket"`
			Number int    `json:"number"`
			Prefix string `json:"prefix"`
			Dest   string `json:"dest"`
			Chime  bool   `json:"chime"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
			return
		}

		ev, err := hub.BroadcastCall(antriankit.CallParams{
			TicketNumber:    req.Ticket,
			NumberOnly:      req.Number,
			Prefix:          req.Prefix,
			DestinationCode: req.Dest,
			BellChime:       req.Chime,
		}, []string{"A-002", "A-003", "B-001"})

		if err != nil {
			http.Error(w, "Gagal proses audio: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "success",
			"event":  ev,
		})
	})

	// 4. Panel Loket Sederhana
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		html := `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Antrian Kit Go - Panel Loket</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; }
    h1 { color: #16a34a; margin-top: 0; font-size: 1.6rem; }
    p { color: #94a3b8; font-size: 0.95rem; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.9rem; }
    input, select { width: 100%; box-sizing: border-box; padding: 10px; background: #0f172a; border: 1px solid #475569; border-radius: 6px; color: white; font-size: 1rem; }
    .btn { background: #16a34a; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 1rem; width: 100%; }
    .btn:hover { background: #15803d; }
    .links { margin-top: 20px; display: flex; gap: 10px; }
    .link-btn { flex: 1; text-align: center; background: #334155; color: #f8fafc; padding: 10px; border-radius: 6px; text-decoration: none; font-size: 0.9rem; font-weight: 600; }
    #status { margin-top: 15px; padding: 10px; border-radius: 6px; display: none; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔊 Antrian Kit (Go) - Panel Loket</h1>
    <p>Simulasi pemanggilan antrean via Go. Buka <strong>Layar TV Display</strong> di tab baru, lalu klik tombol panggil.</p>
    <div class="links">
      <a href="/antrian/display" target="_blank" class="link-btn">📺 Buka Layar TV Display</a>
    </div>
    <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
    <form id="call-form">
      <div class="form-group"><label>Nomor Antrean</label><input type="text" id="ticket" value="B-125" required></div>
      <div class="form-group"><label>Prefix</label><select id="prefix"><option value="A">A</option><option value="B" selected>B</option><option value="C">C</option></select></div>
      <div class="form-group"><label>Nomor (1-999)</label><input type="number" id="number" value="125" min="1" max="999" required></div>
      <div class="form-group"><label>Poli Tujuan</label><select id="dest"><option value="klinik_umum">Poli Umum</option><option value="klinik_gigi" selected>Poli Gigi</option></select></div>
      <button type="submit" class="btn" id="btn-submit">📢 Panggil Sekarang</button>
    </form>
    <div id="status"></div>
  </div>
  <script>
    document.getElementById('call-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const st = document.getElementById('status');
      const payload = {
        ticket: document.getElementById('ticket').value,
        prefix: document.getElementById('prefix').value,
        number: parseInt(document.getElementById('number').value, 10),
        dest: document.getElementById('dest').value,
        chime: true
      };
      try {
        const res = await fetch('/antrian/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        st.style.display = 'block';
        st.style.background = '#14532d';
        st.style.color = '#86efac';
        st.textContent = '✓ Berhasil disiarkan ke Display: ' + payload.ticket;
      } catch (err) {
        st.style.display = 'block';
        st.style.background = '#7f1d1d';
        st.style.color = '#fca5a5';
        st.textContent = 'Gagal memanggil: ' + err.message;
      }
    });
  </script>
</body>
</html>`
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(html))
	})

	port := ":8088"
	fmt.Printf("\n🚀 Antrian Kit Go Server berjalan di http://localhost%s\n", port)
	fmt.Printf("👉 Panel Loket : http://localhost%s\n", port)
	fmt.Printf("👉 Layar TV    : http://localhost%s/antrian/display\n\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
