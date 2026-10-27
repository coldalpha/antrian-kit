package dev.coldalpha.antriankit;

public class CallParams {
    private String ticketNumber;
    private int numberOnly;
    private String destinationCode;
    private String prefix;
    private boolean includeClinicPhrase;
    private boolean bellChime;

    public CallParams(String ticketNumber, int numberOnly) {
        this.ticketNumber = ticketNumber;
        this.numberOnly = numberOnly;
    }

    public String getTicketNumber() { return ticketNumber; }
    public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }

    public int getNumberOnly() { return numberOnly; }
    public void setNumberOnly(int numberOnly) { this.numberOnly = numberOnly; }

    public String getDestinationCode() { return destinationCode; }
    public void setDestinationCode(String destinationCode) { this.destinationCode = destinationCode; }

    public String getPrefix() { return prefix; }
    public void setPrefix(String prefix) { this.prefix = prefix; }

    public boolean isIncludeClinicPhrase() { return includeClinicPhrase; }
    public void setIncludeClinicPhrase(boolean includeClinicPhrase) { this.includeClinicPhrase = includeClinicPhrase; }

    public boolean isBellChime() { return bellChime; }
    public void setBellChime(boolean bellChime) { this.bellChime = bellChime; }
}
