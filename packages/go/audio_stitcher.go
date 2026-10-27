package antriankit

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type AudioStitcher struct {
	BaseAssetDir string
}

func NewAudioStitcher(baseAssetDir string) *AudioStitcher {
	return &AudioStitcher{
		BaseAssetDir: strings.TrimRight(baseAssetDir, "/\\"),
	}
}

// ExtractMp3Frames strips ID3v2 header and ID3v1 trailer
func ExtractMp3Frames(data []byte) []byte {
	length := len(data)
	start := 0

	// Check ID3v2: "ID3"
	if length >= 10 && data[0] == 'I' && data[1] == 'D' && data[2] == '3' {
		b6 := int(data[6] & 0x7f)
		b7 := int(data[7] & 0x7f)
		b8 := int(data[8] & 0x7f)
		b9 := int(data[9] & 0x7f)
		tagSize := (b6 << 21) | (b7 << 14) | (b8 << 7) | b9
		start = 10 + tagSize
	}

	end := length
	// Check ID3v1: last 128 bytes start with "TAG"
	if length >= 128 && data[length-128] == 'T' && data[length-127] == 'A' && data[length-126] == 'G' {
		end = length - 128
	}

	if start >= end || start >= length {
		return data
	}

	return data[start:end]
}

// Stitch stitches multiple relative audio paths or AudioSequenceItems into a single MP3 byte buffer
func (as *AudioStitcher) Stitch(items []AudioSequenceItem) ([]byte, error) {
	var buf bytes.Buffer

	for _, item := range items {
		rel := item.Path
		var full string
		if filepath.IsAbs(rel) {
			full = rel
		} else {
			full = filepath.Join(as.BaseAssetDir, rel)
		}

		raw, err := os.ReadFile(full)
		if err != nil {
			return nil, fmt.Errorf("gagal membaca file audio %s: %w", full, err)
		}

		frames := ExtractMp3Frames(raw)
		buf.Write(frames)
	}

	return buf.Bytes(), nil
}

// StitchAnnouncement convenience method for announcement payload
func (as *AudioStitcher) StitchAnnouncement(payload AudioAnnouncementPayload) ([]byte, error) {
	return as.Stitch(payload.Sequence)
}

// ToBase64 generates Data URI for instant playback
func (as *AudioStitcher) ToBase64(items []AudioSequenceItem) (string, error) {
	raw, err := as.Stitch(items)
	if err != nil {
		return "", err
	}
	return "data:audio/mpeg;base64," + base64.StdEncoding.EncodeToString(raw), nil
}

// SaveToFile writes stitched MP3 buffer to a file
func (as *AudioStitcher) SaveToFile(items []AudioSequenceItem, outPath string) error {
	raw, err := as.Stitch(items)
	if err != nil {
		return err
	}
	return os.WriteFile(outPath, raw, 0644)
}
