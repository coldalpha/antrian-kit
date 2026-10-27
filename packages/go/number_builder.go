package antriankit

import (
	"fmt"
	"strconv"
)

// BuildIndonesianNumberTokens maps integer (1 - 999) to sequence of Indonesian audio tokens
func BuildIndonesianNumberTokens(num int) ([]AudioSequenceItem, error) {
	if num < 1 || num > 999 {
		return nil, fmt.Errorf("nomor antrean di luar jangkauan (1 - 999): %d", num)
	}

	if num <= 11 {
		return []AudioSequenceItem{
			{Token: "num:" + strconv.Itoa(num), Path: fmt.Sprintf("numbers/%d.mp3", num)},
		}, nil
	}

	if num >= 12 && num <= 19 {
		satuan := num - 10
		return []AudioSequenceItem{
			{Token: "num:" + strconv.Itoa(satuan), Path: fmt.Sprintf("numbers/%d.mp3", satuan)},
			{Token: "num:belas", Path: "numbers/belas.mp3"},
		}, nil
	}

	if num <= 99 {
		puluhan := num / 10
		sisa := num % 10
		tokens := []AudioSequenceItem{
			{Token: "num:" + strconv.Itoa(puluhan), Path: fmt.Sprintf("numbers/%d.mp3", puluhan)},
			{Token: "num:puluh", Path: "numbers/puluh.mp3"},
		}
		if sisa > 0 {
			tokens = append(tokens, AudioSequenceItem{
				Token: "num:" + strconv.Itoa(sisa),
				Path:  fmt.Sprintf("numbers/%d.mp3", sisa),
			})
		}
		return tokens, nil
	}

	if num <= 199 {
		tokens := []AudioSequenceItem{
			{Token: "num:seratus", Path: "numbers/seratus.mp3"},
		}
		sisa := num - 100
		if sisa > 0 {
			sub, err := BuildIndonesianNumberTokens(sisa)
			if err != nil {
				return nil, err
			}
			tokens = append(tokens, sub...)
		}
		return tokens, nil
	}

	ratusan := num / 100
	sisa := num % 100
	tokens := []AudioSequenceItem{
		{Token: "num:" + strconv.Itoa(ratusan), Path: fmt.Sprintf("numbers/%d.mp3", ratusan)},
		{Token: "num:ratus", Path: "numbers/ratus.mp3"},
	}
	if sisa > 0 {
		sub, err := BuildIndonesianNumberTokens(sisa)
		if err != nil {
			return nil, err
		}
		tokens = append(tokens, sub...)
	}
	return tokens, nil
}
