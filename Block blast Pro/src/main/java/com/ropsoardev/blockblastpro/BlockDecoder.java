package com.ropsoardev.blockblastpro;

import java.util.HashMap;

public class BlockDecoder {
    public static HashMap<BlockName, boolean[][]> blockMap = null;

    public BlockDecoder() {
        if (blockMap != null) return;
        blockMap = new HashMap<>();

        // 1x1
        blockMap.put(BlockName.DOT, new boolean[][]{{true}});

        // 2x2
        blockMap.put(BlockName.SQUARE_2, new boolean[][]{
            {true, true},
            {true, true}
        });

        // 3x3
        blockMap.put(BlockName.SQUARE_3, new boolean[][]{
            {true, true, true},
            {true, true, true},
            {true, true, true}
        });

        // Lines Horiz
        blockMap.put(BlockName.LINE_H2, new boolean[][]{{true, true}});
        blockMap.put(BlockName.LINE_H3, new boolean[][]{{true, true, true}});
        blockMap.put(BlockName.LINE_H4, new boolean[][]{{true, true, true, true}});
        blockMap.put(BlockName.LINE_H5, new boolean[][]{{true, true, true, true, true}});

        // Lines Vert
        blockMap.put(BlockName.LINE_V2, new boolean[][]{{true}, {true}});
        blockMap.put(BlockName.LINE_V3, new boolean[][]{{true}, {true}, {true}});
        blockMap.put(BlockName.LINE_V4, new boolean[][]{{true}, {true}, {true}, {true}});
        blockMap.put(BlockName.LINE_V5, new boolean[][]{{true}, {true}, {true}, {true}, {true}});

        // L shapes (2x2)
        blockMap.put(BlockName.L_2X2_TL, new boolean[][]{{true, true}, {true, false}});
        blockMap.put(BlockName.L_2X2_TR, new boolean[][]{{true, true}, {false, true}});
        blockMap.put(BlockName.L_2X2_BL, new boolean[][]{{true, false}, {true, true}});
        blockMap.put(BlockName.L_2X2_BR, new boolean[][]{{false, true}, {true, true}});

        // L shapes (3x3)
        blockMap.put(BlockName.L_3X3_TL, new boolean[][]{{true, true, true}, {true, false, false}, {true, false, false}});
        blockMap.put(BlockName.L_3X3_TR, new boolean[][]{{true, true, true}, {false, false, true}, {false, false, true}});
        blockMap.put(BlockName.L_3X3_BL, new boolean[][]{{true, false, false}, {true, false, false}, {true, true, true}});
        blockMap.put(BlockName.L_3X3_BR, new boolean[][]{{false, false, true}, {false, false, true}, {true, true, true}});

        // T shapes
        blockMap.put(BlockName.T_UP,    new boolean[][]{{false, true, false}, {true, true, true}});
        blockMap.put(BlockName.T_DOWN,  new boolean[][]{{true, true, true}, {false, true, false}});
        blockMap.put(BlockName.T_LEFT,  new boolean[][]{{false, true}, {true, true}, {false, true}});
        blockMap.put(BlockName.T_RIGHT, new boolean[][]{{true, false}, {true, true}, {true, false}});

        // Z / S shapes
        blockMap.put(BlockName.Z_H, new boolean[][]{{true, true, false}, {false, true, true}});
        blockMap.put(BlockName.S_H, new boolean[][]{{false, true, true}, {true, true, false}});
        blockMap.put(BlockName.Z_V, new boolean[][]{{false, true}, {true, true}, {true, false}});
        blockMap.put(BlockName.S_V, new boolean[][]{{true, false}, {true, true}, {false, true}});
    }
}
