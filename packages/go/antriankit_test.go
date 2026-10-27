package antriankit

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
)

func TestNumberBuilderId(t *testing.T) {
	tokens, err := BuildIndonesianNumberTokens(125)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(tokens) != 4 {
		t.Fatalf("expected 4 tokens for 125, got %d", len(tokens))
	}

	expected := []string{"num:seratus", "num:2", "num:puluh", "num:5"}
	for i, exp := range expected {
		if tokens[i].Token != exp {
			t.Errorf("token %d expected %s, got %s", i, exp, tokens[i].Token)
		}
	}
}

func TestSequenceBuilderAndStitcher(t *testing.T) {
	sb := NewSequenceBuilder("")
	payload, err := sb.Build(CallParams{
		TicketNumber:        "B-125",
		NumberOnly:          125,
		Prefix:              "B",
		DestinationCode:     "umum",
		IncludeClinicPhrase: true,
		BellChime:           true,
	})
	if err != nil {
		t.Fatalf("build error: %v", err)
	}

	if !payload.BellChime {
		t.Errorf("expected bellChime true")
	}

	if payload.Sequence[0].Token != "bell:chime" {
		t.Errorf("expected sequence[0] to be bell:chime, got %s", payload.Sequence[0].Token)
	}

	// Assets directory
	assetsDir, err := filepath.Abs("../audio/assets/id")
	if err != nil {
		t.Fatalf("failed to resolve assets path: %v", err)
	}

	stitcher := NewAudioStitcher(assetsDir)
	mp3, err := stitcher.StitchAnnouncement(payload)
	if err != nil {
		t.Fatalf("stitch error: %v", err)
	}

	if len(mp3) < 50000 {
		t.Errorf("stitched MP3 size too small: %d bytes", len(mp3))
	}

	if mp3[0] != 0xff {
		t.Errorf("expected first byte of MP3 to be 0xFF, got 0x%x", mp3[0])
	}

	b64, err := stitcher.ToBase64(payload.Sequence)
	if err != nil {
		t.Fatalf("toBase64 error: %v", err)
	}

	if !strings.HasPrefix(b64, "data:audio/mpeg;base64,") {
		t.Errorf("data URI prefix invalid")
	}
}

func TestDisplayHub(t *testing.T) {
	assetsDir, err := filepath.Abs("../audio/assets/id")
	if err != nil {
		t.Fatalf("failed to resolve assets path: %v", err)
	}

	hub := NewDisplayHub(assetsDir, DisplayConfig{
		ClinicName: "Klinik RSUD Batang",
		StreamURL:  "/custom/stream",
	})

	// 1. Test HTML handler
	req := httptest.NewRequest("GET", "/display", nil)
	w := httptest.NewRecorder()
	hub.DisplayHandler()(w, req)

	res := w.Result()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}

	body := w.Body.String()
	if !strings.Contains(body, "Klinik RSUD Batang") {
		t.Errorf("HTML should contain clinic name")
	}
	if !strings.Contains(body, "/custom/stream") {
		t.Errorf("HTML should contain custom stream url")
	}

	// 2. Test BroadcastCall
	ev, err := hub.BroadcastCall(CallParams{
		TicketNumber:    "A-005",
		NumberOnly:      5,
		Prefix:          "A",
		DestinationCode: "klinik_gigi",
		BellChime:       true,
	}, []string{"A-006", "A-007"})

	if err != nil {
		t.Fatalf("broadcast call error: %v", err)
	}

	if ev.TicketNumber != "A-005" {
		t.Errorf("expected ticket A-005, got %s", ev.TicketNumber)
	}
	if !strings.HasPrefix(ev.Audio, "data:audio/mpeg;base64,") {
		t.Errorf("expected audio base64 data URI")
	}
	if len(ev.Waiting) != 2 {
		t.Errorf("expected 2 waiting tickets, got %d", len(ev.Waiting))
	}
}
