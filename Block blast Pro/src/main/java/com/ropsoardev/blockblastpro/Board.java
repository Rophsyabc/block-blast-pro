package com.ropsoardev.blockblastpro;

public class Board {
    public boolean[][] table;
    public int[][] colorTable; // RGB integers

    public Board() {
        table = new boolean[8][8];
        colorTable = new int[8][8];
        if (BlockDecoder.blockMap == null) {
            new BlockDecoder();
        }
    }

    public Board(boolean[][] initialTable) {
        this();
        if (initialTable != null && initialTable.length == 8 && initialTable[0].length == 8) {
            for (int i = 0; i < 8; i++) {
                for (int j = 0; j < 8; j++) {
                    this.table[i][j] = initialTable[i][j];
                    if (initialTable[i][j]) {
                        this.colorTable[i][j] = 0xFF2980B9; // Default blue
                    }
                }
            }
        }
    }

    public void setRow(int i, boolean[] row) {
        if (i >= 0 && i < 8 && row != null && row.length == 8) {
            for (int j = 0; j < 8; j++) {
                table[i][j] = row[j];
                if (row[j]) {
                    colorTable[i][j] = 0xFF2980B9;
                } else {
                    colorTable[i][j] = 0;
                }
            }
        }
    }

    public boolean canPlace(int r, int c, BlockName block) {
        if (block == null) return false;
        if (BlockDecoder.blockMap == null) {
            new BlockDecoder();
        }
        boolean[][] shape = BlockDecoder.blockMap.get(block);
        if (shape == null) return false;
        int shapeRows = shape.length;
        int shapeCols = shape[0].length;

        if (r < 0 || c < 0 || r + shapeRows > 8 || c + shapeCols > 8) {
            return false;
        }

        for (int i = 0; i < shapeRows; i++) {
            for (int j = 0; j < shapeCols; j++) {
                if (shape[i][j] && table[r + i][c + j]) {
                    return false;
                }
            }
        }
        return true;
    }

    public int placeBlock(int r, int c, BlockName block) {
        if (!canPlace(r, c, block)) return 0;

        boolean[][] shape = BlockDecoder.blockMap.get(block);
        int color = getBlockColor(block);

        for (int i = 0; i < shape.length; i++) {
            for (int j = 0; j < shape[0].length; j++) {
                if (shape[i][j]) {
                    table[r + i][c + j] = true;
                    colorTable[r + i][c + j] = color;
                }
            }
        }

        return clearLines();
    }

    public int clearLines() {
        boolean[] rowsToClear = new boolean[8];
        boolean[] colsToClear = new boolean[8];
        int linesCleared = 0;

        for (int i = 0; i < 8; i++) {
            boolean fullRow = true;
            for (int j = 0; j < 8; j++) {
                if (!table[i][j]) {
                    fullRow = false;
                    break;
                }
            }
            if (fullRow) {
                rowsToClear[i] = true;
                linesCleared++;
            }
        }

        for (int j = 0; j < 8; j++) {
            boolean fullCol = true;
            for (int i = 0; i < 8; i++) {
                if (!table[i][j]) {
                    fullCol = false;
                    break;
                }
            }
            if (fullCol) {
                colsToClear[j] = true;
                linesCleared++;
            }
        }

        for (int i = 0; i < 8; i++) {
            for (int j = 0; j < 8; j++) {
                if (rowsToClear[i] || colsToClear[j]) {
                    table[i][j] = false;
                    colorTable[i][j] = 0;
                }
            }
        }

        return linesCleared;
    }

    public static int getBlockColor(BlockName block) {
        if (block == null) return 0xFF3498DB;
        String name = block.name();
        if (name.startsWith("DOT"))      return 0xFFF1C40F; // Gold
        if (name.startsWith("SQUARE"))   return 0xFFE67E22; // Orange
        if (name.startsWith("LINE_H"))   return 0xFF2ECC71; // Emerald
        if (name.startsWith("LINE_V"))   return 0xFF1ABC9C; // Turquoise
        if (name.startsWith("L_2X2"))    return 0xFF3498DB; // Blue
        if (name.startsWith("L_3X3"))    return 0xFF9B59B6; // Amethyst
        if (name.startsWith("T_"))       return 0xFFE74C3C; // Crimson
        if (name.startsWith("Z_"))       return 0xFFFF7675; // Coral Pink
        if (name.startsWith("S_"))       return 0xFFA29BFE; // Lavender
        return 0xFF3498DB;
    }

    public Board clone() {
        Board b = new Board();
        for (int i = 0; i < 8; i++) {
            System.arraycopy(this.table[i], 0, b.table[i], 0, 8);
            System.arraycopy(this.colorTable[i], 0, b.colorTable[i], 0, 8);
        }
        return b;
    }
}
