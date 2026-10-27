package antriankit

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
)

type SequenceBuilder struct {
	BaseAssetDir string
}

func NewSequenceBuilder(baseAssetDir string) *SequenceBuilder {
	return &SequenceBuilder{
		BaseAssetDir: strings.TrimRight(baseAssetDir, "/\\"),
	}
}

func (sb *SequenceBuilder) Build(params CallParams) (AudioAnnouncementPayload, error) {
	var sequence []AudioSequenceItem

	if params.BellChime {
		sequence = append(sequence, AudioSequenceItem{
			Token: "bell:chime",
			Path:  "bells/bell.mp3",
			Text:  "Ting Tung",
		})
	}

	sequence = append(sequence, AudioSequenceItem{
		Token: "phrase:nomor_antrian",
		Path:  "phrases/nomor_antrian.mp3",
		Text:  "Nomor Antrian",
	})

	if params.Prefix != "" {
		p := strings.ToLower(strings.TrimSpace(params.Prefix))
		sequence = append(sequence, AudioSequenceItem{
			Token: "letter:" + p,
			Path:  fmt.Sprintf("letters/%s.mp3", p),
			Text:  strings.ToUpper(p),
		})
	}

	numTokens, err := BuildIndonesianNumberTokens(params.NumberOnly)
	if err != nil {
		return AudioAnnouncementPayload{}, err
	}
	sequence = append(sequence, numTokens...)

	sequence = append(sequence, AudioSequenceItem{
		Token: "phrase:silakan_menuju",
		Path:  "phrases/silakan_menuju.mp3",
		Text:  "Silahkan Menuju",
	})

	if params.IncludeClinicPhrase {
		sequence = append(sequence, AudioSequenceItem{
			Token: "phrase:ke_klinik",
			Path:  "phrases/ke_klinik.mp3",
			Text:  "Ke Klinik",
		})
	}

	dest := params.DestinationCode
	if dest == "" {
		dest = "klinik_gigi"
	}
	sequence = append(sequence, AudioSequenceItem{
		Token: "dest:" + dest,
		Path:  fmt.Sprintf("destinations/%s.mp3", dest),
		Text:  strings.ReplaceAll(dest, "_", " "),
	})

	randBytes := make([]byte, 2)
	rand.Read(randBytes)
	id := fmt.Sprintf("ann_%d_%s", time.Now().UnixMilli(), hex.EncodeToString(randBytes))

	return AudioAnnouncementPayload{
		ID:           id,
		TicketNumber: params.TicketNumber,
		Destination:  dest,
		Language:     "id-ID",
		Sequence:     sequence,
		BellChime:    params.BellChime,
	}, nil
}
