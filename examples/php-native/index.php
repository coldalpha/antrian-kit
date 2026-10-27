<?php

declare(strict_types=1);

require_once __DIR__ . '/../../packages/php/src/NumberBuilderId.php';
require_once __DIR__ . '/../../packages/php/src/SequenceBuilder.php';
require_once __DIR__ . '/../../packages/php/src/AudioStitcher.php';
require_once __DIR__ . '/../../packages/php/src/Display.php';
require_once __DIR__ . '/../../packages/php/src/Realtime/SseBroadcaster.php';
require_once __DIR__ . '/../../packages/php/src/AntrianKit.php';

use AntrianKit\AntrianKit;

// Set asset directory
AntrianKit::setAssetPath(__DIR__ . '/../../packages/audio/assets/id');

$action = $_GET['action'] ?? $_POST['action'] ?? null;

// 1. SSE Stream Route
if ($action === 'stream') {
    AntrianKit::streamEvents(20);
    exit;
}

// 2. Broadcast Call Route (AJAX / POST)
if ($action === 'call' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

    $ticket = trim($input['ticket'] ?? 'A-001');
    $num = (int)($input['number'] ?? 1);
    $prefix = trim($input['prefix'] ?? 'A');
    $dest = trim($input['dest'] ?? 'klinik_umum');
    $destLabel = trim($input['dest_label'] ?? 'Poli Umum');
    $chime = !empty($input['chime']);

    $res = AntrianKit::broadcastCall([
        'ticketNumber'     => $ticket,
        'numberOnly'       => $num,
        'prefix'           => $prefix,
        'destinationCode'  => $dest,
        'destinationLabel' => $destLabel,
        'bellChime'        => $chime,
        'waiting'          => ['A-002', 'A-003', 'B-005'],
    ]);

    echo json_encode(['status' => 'success', 'event' => $res]);
    exit;
}

// 3. TV Display Route
if ($action === 'display') {
    echo AntrianKit::renderDisplay([
        'clinic_name'  => 'RSUD Batang / Praktik Mandiri',
        'stream_url'   => '?action=stream',
        'running_text' => 'Selamat datang di Antrian Kit Demo. Suara panggilan otomatis digabung tanpa jeda.',
    ]);
    exit;
}

// 4. Default: Loket Control Panel
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Antrian Kit - Panel Loket Pemanggil</title>
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
    .link-btn:hover { background: #475569; }
    #status { margin-top: 15px; padding: 10px; border-radius: 6px; display: none; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔊 Antrian Kit - Panel Loket</h1>
    <p>Simulasi pemanggilan antrean. Buka <strong>Layar TV Display</strong> di tab baru, lalu klik tombol panggil.</p>

    <div class="links">
      <a href="?action=display" target="_blank" class="link-btn">📺 Buka Layar TV Display</a>
    </div>

    <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">

    <form id="call-form">
      <div class="form-group">
        <label>Nomor Antrean Penuh</label>
        <input type="text" id="ticket" value="A-025" required>
      </div>

      <div class="form-group">
        <label>Huruf Prefix</label>
        <select id="prefix">
          <option value="A" selected>A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="E">E</option>
        </select>
      </div>

      <div class="form-group">
        <label>Angka Nomor (1 - 999)</label>
        <input type="number" id="number" value="25" min="1" max="999" required>
      </div>

      <div class="form-group">
        <label>Poli / Loket Tujuan</label>
        <select id="dest">
          <option value="klinik_umum" selected>Poli Umum</option>
          <option value="klinik_gigi">Poli Gigi</option>
        </select>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" id="chime" checked style="width: auto;">
          Gunakan Suara Bel Pembuka (Ting Tung)
        </label>
      </div>

      <button type="submit" class="btn" id="btn-submit">📢 Panggil Sekarang</button>
    </form>

    <div id="status"></div>
  </div>

  <script>
    document.getElementById('call-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = document.getElementById('btn-submit');
      const st = document.getElementById('status');

      btn.disabled = true;
      btn.textContent = 'Memproses & Menggabungkan Suara...';

      const payload = {
        ticket: document.getElementById('ticket').value,
        prefix: document.getElementById('prefix').value,
        number: parseInt(document.getElementById('number').value, 10),
        dest: document.getElementById('dest').value,
        dest_label: document.getElementById('dest').options[document.getElementById('dest').selectedIndex].text,
        chime: document.getElementById('chime').checked
      };

      try {
        const res = await fetch('?action=call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        st.style.display = 'block';
        st.style.background = '#14532d';
        st.style.color = '#86efac';
        st.textContent = `✓ Berhasil disiarkan ke Display: ${payload.ticket} menuju ${payload.dest_label}`;
      } catch (err) {
        st.style.display = 'block';
        st.style.background = '#7f1d1d';
        st.style.color = '#fca5a5';
        st.textContent = 'Gagal memanggil antrean: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = '📢 Panggil Sekarang';
      }
    });
  </script>
</body>
</html>
