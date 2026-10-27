package antriankit

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"strings"
	"sync"
	"time"
)

//go:embed display.html
var displayHTMLTemplate string

type DisplayConfig struct {
	ClinicName  string
	StreamURL   string
	RunningText string
}

type CallEvent struct {
	Type         string   `json:"type"`
	ID           string   `json:"id"`
	TicketNumber string   `json:"ticketNumber"`
	Destination  string   `json:"destination"`
	Audio        string   `json:"audio,omitempty"`
	Waiting      []string `json:"waiting,omitempty"`
	Timestamp    int64    `json:"timestamp"`
}

type DisplayHub struct {
	config    DisplayConfig
	assetsDir string
	stitcher  *AudioStitcher
	seqBuild  *SequenceBuilder

	mu      sync.RWMutex
	clients map[chan []byte]bool
}

func NewDisplayHub(assetsDir string, config ...DisplayConfig) *DisplayHub {
	cfg := DisplayConfig{
		ClinicName:  "Klinik Mandiri",
		StreamURL:   "/antrian/stream",
		RunningText: "Selamat datang. Harap memperhatikan nomor antrean dan menuju ke ruangan yang ditentukan.",
	}
	if len(config) > 0 {
		if config[0].ClinicName != "" {
			cfg.ClinicName = config[0].ClinicName
		}
		if config[0].StreamURL != "" {
			cfg.StreamURL = config[0].StreamURL
		}
		if config[0].RunningText != "" {
			cfg.RunningText = config[0].RunningText
		}
	}

	return &DisplayHub{
		config:    cfg,
		assetsDir: assetsDir,
		stitcher:  NewAudioStitcher(assetsDir),
		seqBuild:  NewSequenceBuilder(assetsDir),
		clients:   make(map[chan []byte]bool),
	}
}

// DisplayHandler serves the HTML TV dashboard
func (h *DisplayHub) DisplayHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		htmlContent := displayHTMLTemplate
		htmlContent = strings.ReplaceAll(htmlContent, "{{CLINIC_NAME}}", html.EscapeString(h.config.ClinicName))
		htmlContent = strings.ReplaceAll(htmlContent, "{{STREAM_URL}}", html.EscapeString(h.config.StreamURL))
		htmlContent = strings.ReplaceAll(htmlContent, "{{RUNNING_TEXT}}", html.EscapeString(h.config.RunningText))

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(htmlContent))
	}
}

// EventsHandler handles Server-Sent Events (SSE) connections
func (h *DisplayHub) EventsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")

		messageChan := make(chan []byte, 16)

		h.mu.Lock()
		h.clients[messageChan] = true
		h.mu.Unlock()

		defer func() {
			h.mu.Lock()
			delete(h.clients, messageChan)
			close(messageChan)
			h.mu.Unlock()
		}()

		// Send initial ping
		_, _ = fmt.Fprintf(w, ": ping\n\n")
		flusher.Flush()

		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		ctx := r.Context()
		for {
			select {
			case <-ctx.Done():
				return
			case msg := <-messageChan:
				_, _ = fmt.Fprintf(w, "data: %s\n\n", msg)
				flusher.Flush()
			case <-ticker.C:
				_, _ = fmt.Fprintf(w, ": ping\n\n")
				flusher.Flush()
			}
		}
	}
}

// BroadcastCall builds announcement audio and broadcasts to all connected display screens
func (h *DisplayHub) BroadcastCall(params CallParams, waitingList []string) (*CallEvent, error) {
	payload, err := h.seqBuild.Build(params)
	if err != nil {
		return nil, fmt.Errorf("failed to build announcement sequence: %w", err)
	}

	audioBase64, err := h.stitcher.ToBase64(payload.Sequence)
	if err != nil {
		return nil, fmt.Errorf("failed to stitch audio frames: %w", err)
	}

	dest := params.DestinationCode
	if dest == "" {
		dest = "Poli Umum"
	}
	dest = strings.ReplaceAll(dest, "_", " ")
	dest = strings.ToUpper(dest)

	ev := &CallEvent{
		Type:         "call",
		ID:           payload.ID,
		TicketNumber: params.TicketNumber,
		Destination:  dest,
		Audio:        audioBase64,
		Waiting:      waitingList,
		Timestamp:    time.Now().UnixMilli(),
	}

	data, err := json.Marshal(ev)
	if err != nil {
		return nil, err
	}

	h.broadcast(data)
	return ev, nil
}

// BroadcastQueueUpdate broadcasts updated waiting ticket list
func (h *DisplayHub) BroadcastQueueUpdate(waitingList []string) error {
	ev := map[string]interface{}{
		"type":      "queue_update",
		"waiting":   waitingList,
		"timestamp": time.Now().UnixMilli(),
	}
	data, err := json.Marshal(ev)
	if err != nil {
		return err
	}

	h.broadcast(data)
	return nil
}

func (h *DisplayHub) broadcast(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for ch := range h.clients {
		select {
		case ch <- msg:
		default:
			// Buffer full, skip to avoid slow client blocking
		}
	}
}
