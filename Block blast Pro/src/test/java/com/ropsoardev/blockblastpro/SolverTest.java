package com.ropsoardev.blockblastpro;

import org.junit.Test;
import static org.junit.Assert.*;

public class SolverTest {
    @Test
    public void testFindBestSingleMove() {
        Board b = new Board();
        BlockName[] hand = new BlockName[]{BlockName.DOT, BlockName.LINE_H2, BlockName.LINE_V2};
        boolean[] used = new boolean[]{false, false, false};

        Main.MoveHint hint = Main.findBestSingleMove(b, hand, used);
        assertNotNull(hint);
        assertTrue(hint.row >= 0 && hint.row < 8);
        assertTrue(hint.col >= 0 && hint.col < 8);
    }

    @Test
    public void testSearchSequence() {
        Board b = new Board();
        BlockName[] hand = new BlockName[]{BlockName.DOT, BlockName.LINE_H2};

        Solution sol = Main.searchSequence(b, hand);
        assertNotNull(sol);
        assertEquals(2, sol.order.length);
    }
}
