package antriankit

type AudioSequenceItem struct {
	Token string `json:"token"`
	Path  string `json:"path"`
	Text  string `json:"text,omitempty"`
}

type AudioAnnouncementPayload struct {
	ID           string              `json:"id"`
	TicketNumber string              `json:"ticketNumber"`
	Destination  string              `json:"destination"`
	Language     string              `json:"language"`
	Sequence     []AudioSequenceItem `json:"sequence"`
	BellChime    bool                `json:"bellChime"`
}

type CallParams struct {
	TicketNumber        string `json:"ticketNumber"`
	NumberOnly          int    `json:"numberOnly"`
	DestinationCode     string `json:"destinationCode,omitempty"`
	Prefix              string `json:"prefix,omitempty"`
	IncludeClinicPhrase bool   `json:"includeClinicPhrase,omitempty"`
	BellChime           bool   `json:"bellChime,omitempty"`
}
