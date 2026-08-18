package com.ropsoardev.blockblastpro;

import javax.sound.sampled.*;
import java.io.ByteArrayInputStream;

public class SoundManager {
    private static boolean soundEnabled = true;

    public static void toggleSound() {
        soundEnabled = !soundEnabled;
    }

    public static boolean isEnabled() {
        return soundEnabled;
    }

    public static void playTone(int frequency, int durationMs) {
        if (!soundEnabled) return;
        new Thread(() -> {
            try {
                float sampleRate = 44100;
                byte[] buf = new byte[(int) (sampleRate * (durationMs / 1000.0))];
                for (int i = 0; i < buf.length; i++) {
                    double angle = i / (sampleRate / frequency) * 2.0 * Math.PI;
                    buf[i] = (byte) (Math.sin(angle) * 127);
                }

                AudioFormat format = new AudioFormat(sampleRate, 8, 1, true, true);
                DataLine.Info info = new DataLine.Info(Clip.class, format);
                Clip clip = (Clip) AudioSystem.getLine(info);
                clip.open(format, buf, 0, buf.length);
                clip.start();
            } catch (Exception ignored) {}
        }).start();
    }

    public static void playPlace() {
        playTone(523, 80); // C5
    }

    public static void playClear() {
        new Thread(() -> {
            playTone(659, 100); // E5
            try { Thread.sleep(80); } catch (Exception ignored) {}
            playTone(784, 150); // G5
        }).start();
    }

    public static void playStreak() {
        new Thread(() -> {
            playTone(523, 80); // C5
            try { Thread.sleep(60); } catch (Exception ignored) {}
            playTone(659, 80); // E5
            try { Thread.sleep(60); } catch (Exception ignored) {}
            playTone(784, 80); // G5
            try { Thread.sleep(60); } catch (Exception ignored) {}
            playTone(1046, 120); // C6
        }).start();
    }

    public static void playGameOver() {
        new Thread(() -> {
            playTone(392, 120); // G4
            try { Thread.sleep(100); } catch (Exception ignored) {}
            playTone(349, 120); // F4
            try { Thread.sleep(100); } catch (Exception ignored) {}
            playTone(293, 200); // D4
        }).start();
    }
}
