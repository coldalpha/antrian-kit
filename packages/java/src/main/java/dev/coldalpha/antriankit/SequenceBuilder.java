package dev.coldalpha.antriankit;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class SequenceBuilder {
    private String baseAssetDir;

    public SequenceBuilder() {
        this("");
    }

    public SequenceBuilder(String baseAssetDir) {
        this.baseAssetDir = baseAssetDir == null ? "" : baseAssetDir.replaceAll("[/\\\\]+$", "");
    }

    public AudioAnnouncementPayload build(CallParams params) {
        List<AudioSequenceItem> sequence = new ArrayList<>();

        if (params.isBellChime()) {
            sequence.add(new AudioSequenceItem("bell:chime", "bells/bell.mp3", "Ting Tung"));
        }

        sequence.add(new AudioSequenceItem("phrase:nomor_antrian", "phrases/nomor_antrian.mp3", "Nomor Antrian"));

        if (params.getPrefix() != null && !params.getPrefix().trim().isEmpty()) {
            String p = params.getPrefix().trim().toLowerCase();
            sequence.add(new AudioSequenceItem("letter:" + p, "letters/" + p + ".mp3", p.toUpperCase()));
        }

        sequence.addAll(NumberBuilderId.build(params.getNumberOnly()));

        sequence.add(new AudioSequenceItem("phrase:silakan_menuju", "phrases/silakan_menuju.mp3", "Silahkan Menuju"));

        if (params.isIncludeClinicPhrase()) {
            sequence.add(new AudioSequenceItem("phrase:ke_klinik", "phrases/ke_klinik.mp3", "Ke Klinik"));
        }

        String dest = params.getDestinationCode() == null || params.getDestinationCode().isEmpty()
                ? "klinik_gigi"
                : params.getDestinationCode();

        sequence.add(new AudioSequenceItem("dest:" + dest, "destinations/" + dest + ".mp3", dest.replace('_', ' ')));

        String id = "ann_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 4);

        return new AudioAnnouncementPayload(
                id,
                params.getTicketNumber(),
                dest,
                "id-ID",
                sequence,
                params.isBellChime()
        );
    }
}
