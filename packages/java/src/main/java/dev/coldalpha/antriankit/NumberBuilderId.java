package dev.coldalpha.antriankit;

import java.util.ArrayList;
import java.util.List;

public class NumberBuilderId {

    public static List<AudioSequenceItem> build(int num) {
        if (num < 1 || num > 999) {
            throw new IllegalArgumentException("Nomor antrean di luar jangkauan (1 - 999): " + num);
        }

        List<AudioSequenceItem> tokens = new ArrayList<>();

        if (num <= 11) {
            tokens.add(new AudioSequenceItem("num:" + num, "numbers/" + num + ".mp3"));
            return tokens;
        }

        if (num >= 12 && num <= 19) {
            int satuan = num - 10;
            tokens.add(new AudioSequenceItem("num:" + satuan, "numbers/" + satuan + ".mp3"));
            tokens.add(new AudioSequenceItem("num:belas", "numbers/belas.mp3"));
            return tokens;
        }

        if (num <= 99) {
            int puluhan = num / 10;
            int sisa = num % 10;
            tokens.add(new AudioSequenceItem("num:" + puluhan, "numbers/" + puluhan + ".mp3"));
            tokens.add(new AudioSequenceItem("num:puluh", "numbers/puluh.mp3"));
            if (sisa > 0) {
                tokens.add(new AudioSequenceItem("num:" + sisa, "numbers/" + sisa + ".mp3"));
            }
            return tokens;
        }

        if (num <= 199) {
            tokens.add(new AudioSequenceItem("num:seratus", "numbers/seratus.mp3"));
            int sisa = num - 100;
            if (sisa > 0) {
                tokens.addAll(build(sisa));
            }
            return tokens;
        }

        int ratusan = num / 100;
        int sisa = num % 100;
        tokens.add(new AudioSequenceItem("num:" + ratusan, "numbers/" + ratusan + ".mp3"));
        tokens.add(new AudioSequenceItem("num:ratus", "numbers/ratus.mp3"));
        if (sisa > 0) {
            tokens.addAll(build(sisa));
        }
        return tokens;
    }
}
