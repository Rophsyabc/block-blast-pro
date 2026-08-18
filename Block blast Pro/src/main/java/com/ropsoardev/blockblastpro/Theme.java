package com.ropsoardev.blockblastpro;

public enum Theme {
    DARK("Cyber Dark", 0xFF0F1219, 0xFF171B26, 0xFF232A3B, 0xFF3498DB),
    AURORA("Aurora", 0xFF0B1B2B, 0xFF10283B, 0xFF193B56, 0xFF00CEC9),
    SUNSET("Sunset", 0xFF1A0B1B, 0xFF2B1028, 0xFF3B1936, 0xFFFD79A8),
    MIDNIGHT("Midnight", 0xFF08090C, 0xFF0F1118, 0xFF181C26, 0xFF6C5CE7);

    private final String displayName;
    private final int darkBg;
    private final int panelBg;
    private final int boardBg;
    private final int accent;

    Theme(String displayName, int darkBg, int panelBg, int boardBg, int accent) {
        this.displayName = displayName;
        this.darkBg = darkBg;
        this.panelBg = panelBg;
        this.boardBg = boardBg;
        this.accent = accent;
    }

    public String getDisplayName() { return displayName; }
    public int getDarkBg() { return darkBg; }
    public int getPanelBg() { return panelBg; }
    public int getBoardBg() { return boardBg; }
    public int getAccent() { return accent; }
}
