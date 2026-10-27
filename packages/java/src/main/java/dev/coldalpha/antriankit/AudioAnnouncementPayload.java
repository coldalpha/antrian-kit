package dev.coldalpha.antriankit;

import java.util.List;

public class AudioAnnouncementPayload {
    private String id;
    private String ticketNumber;
    private String destination;
    private String language;
    private List<AudioSequenceItem> sequence;
    private boolean bellChime;

    public AudioAnnouncementPayload() {}

    public AudioAnnouncementPayload(String id, String ticketNumber, String destination, String language, List<AudioSequenceItem> sequence, boolean bellChime) {
        this.id = id;
        this.ticketNumber = ticketNumber;
        this.destination = destination;
        this.language = language;
        this.sequence = sequence;
        this.bellChime = bellChime;
    }

    public String getId() { return id; }
    public String getTicketNumber() { return ticketNumber; }
    public String getDestination() { return destination; }
    public String getLanguage() { return language; }
    public List<AudioSequenceItem> getSequence() { return sequence; }
    public boolean isBellChime() { return bellChime; }
}
