package com.ropsoardev.blockblastpro;

import java.util.Random;

public enum BlockName {
    DOT,
    SQUARE_2,
    SQUARE_3,
    LINE_H2,
    LINE_H3,
    LINE_H4,
    LINE_H5,
    LINE_V2,
    LINE_V3,
    LINE_V4,
    LINE_V5,
    L_2X2_TL,
    L_2X2_TR,
    L_2X2_BL,
    L_2X2_BR,
    L_3X3_TL,
    L_3X3_TR,
    L_3X3_BL,
    L_3X3_BR,
    T_UP,
    T_DOWN,
    T_LEFT,
    T_RIGHT,
    Z_H,
    S_H,
    Z_V,
    S_V;

    private static final BlockName[] VALUES = values();
    private static final int SIZE = VALUES.length;
    private static final Random RANDOM = new Random();

    public static BlockName getRandomBlock() {
        return VALUES[RANDOM.nextInt(SIZE)];
    }
}
