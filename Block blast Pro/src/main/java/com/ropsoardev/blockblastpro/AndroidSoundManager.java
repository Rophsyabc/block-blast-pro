package com.ropsoardev.blockblastpro;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.SoundPool;

public class AndroidSoundManager {
    private static SoundPool soundPool;
    private static int soundPlace;
    private static int soundClear;
    private static int soundStreak;
    private static int soundGameOver;
    private static boolean soundEnabled = true;
    private static boolean initialized = false;

    public static void init(Context context) {
        if (initialized) return;

        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

        soundPool = new SoundPool.Builder()
                .setMaxStreams(5)
                .setAudioAttributes(audioAttributes)
                .build();

        initialized = true;
    }

    public static void toggleSound() {
        soundEnabled = !soundEnabled;
    }

    public static boolean isEnabled() {
        return soundEnabled;
    }

    public static void playPlace() {
        if (!soundEnabled || soundPool == null) return;
        if (soundPlace != 0) soundPool.play(soundPlace, 1.0f, 1.0f, 0, 0, 1.0f);
    }

    public static void playClear() {
        if (!soundEnabled || soundPool == null) return;
        if (soundClear != 0) soundPool.play(soundClear, 1.0f, 1.0f, 0, 0, 1.0f);
    }

    public static void playStreak() {
        if (!soundEnabled || soundPool == null) return;
        if (soundStreak != 0) soundPool.play(soundStreak, 1.0f, 1.0f, 0, 0, 1.2f);
    }

    public static void playGameOver() {
        if (!soundEnabled || soundPool == null) return;
        if (soundGameOver != 0) soundPool.play(soundGameOver, 1.0f, 1.0f, 0, 0, 0.8f);
    }
}
