package dev.coldalpha.antriankit;

public class AudioSequenceItem {
    private String token;
    private String path;
    private String text;

    public AudioSequenceItem() {}

    public AudioSequenceItem(String token, String path) {
        this.token = token;
        this.path = path;
    }

    public AudioSequenceItem(String token, String path, String text) {
        this.token = token;
        this.path = path;
        this.text = text;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
