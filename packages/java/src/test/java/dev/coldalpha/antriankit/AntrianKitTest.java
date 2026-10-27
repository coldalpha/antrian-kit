package dev.coldalpha.antriankit;

import org.junit.jupiter.api.Test;
import java.io.File;
import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class AntrianKitTest {

    @Test
    public void testNumberBuilderId() {
        List<AudioSequenceItem> tokens = NumberBuilderId.build(125);
        assertEquals(4, tokens.size());
        assertEquals("num:seratus", tokens.get(0).getToken());
        assertEquals("num:2", tokens.get(1).getToken());
        assertEquals("num:puluh", tokens.get(2).getToken());
        assertEquals("num:5", tokens.get(3).getToken());
    }

    @Test
    public void testSequenceBuilderAndStitcher() throws IOException {
        SequenceBuilder sb = new SequenceBuilder();
        CallParams params = new CallParams("B-125", 125);
        params.setPrefix("B");
        params.setDestinationCode("umum");
        params.setIncludeClinicPhrase(true);
        params.setBellChime(true);

        AudioAnnouncementPayload payload = sb.build(params);

        assertTrue(payload.isBellChime());
        assertEquals("bell:chime", payload.getSequence().get(0).getToken());

        File assetsDir = new File("../audio/assets/id").getCanonicalFile();
        assertTrue(assetsDir.exists(), "Assets directory must exist");

        AudioStitcher stitcher = new AudioStitcher(assetsDir.getAbsolutePath());
        byte[] mp3 = stitcher.stitchAnnouncement(payload);

        assertTrue(mp3.length > 50000, "Merged MP3 size must be substantial");
        assertEquals((byte) 0xff, mp3[0], "First byte must be MP3 frame sync 0xFF");

        String b64 = stitcher.toBase64(payload.getSequence());
        assertTrue(b64.startsWith("data:audio/mpeg;base64,"));
    }
}
