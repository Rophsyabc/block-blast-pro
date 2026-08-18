package com.ropsoardev.blockblastpro;

import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

public class BoardTest {
    private Board board;

    @Before
    public void setUp() {
        board = new Board();
    }

    @Test
    public void testCanPlaceInEmptyBoard() {
        assertTrue(board.canPlace(0, 0, BlockName.DOT));
        assertTrue(board.canPlace(0, 0, BlockName.SQUARE_2));
        assertTrue(board.canPlace(0, 0, BlockName.LINE_H5));
    }

    @Test
    public void testCannotPlaceOutOfBounds() {
        assertFalse(board.canPlace(0, 7, BlockName.LINE_H2));
        assertFalse(board.canPlace(7, 0, BlockName.LINE_V2));
        assertFalse(board.canPlace(6, 6, BlockName.SQUARE_3));
    }

    @Test
    public void testPlaceBlockAndClearRow() {
        for (int c = 0; c < 7; c++) {
            board.table[0][c] = true;
        }
        int lines = board.placeBlock(0, 7, BlockName.DOT);
        assertEquals(1, lines);
        assertFalse(board.table[0][7]);
    }
}
