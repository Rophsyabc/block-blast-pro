package com.ropsoardev.blockblastpro;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {

    public static class MoveHint {
        public int row;
        public int col;
        public BlockName block;
        public int score;
        public int linesCleared;

        public MoveHint(int row, int col, BlockName block, int score, int linesCleared) {
            this.row = row;
            this.col = col;
            this.block = block;
            this.score = score;
            this.linesCleared = linesCleared;
        }
    }

    public static MoveHint findBestSingleMove(Board board, BlockName[] hand, boolean[] used) {
        MoveHint bestHint = null;
        int bestScore = Integer.MIN_VALUE;

        for (int i = 0; i < 3; i++) {
            if (used[i] || hand[i] == null) continue;
            BlockName block = hand[i];

            for (int r = 0; r < 8; r++) {
                for (int c = 0; c < 8; c++) {
                    if (board.canPlace(r, c, block)) {
                        Board cloneBoard = board.clone();
                        int linesCleared = cloneBoard.placeBlock(r, c, block);
                        int eval = evaluateBoard(cloneBoard, linesCleared);

                        if (eval > bestScore) {
                            bestScore = eval;
                            bestHint = new MoveHint(r, c, block, eval, linesCleared);
                        }
                    }
                }
            }
        }
        return bestHint;
    }

    public static Solution searchSequence(Board initialBoard, BlockName[] blocks) {
        List<BlockName> list = new ArrayList<>();
        for (BlockName b : blocks) {
            if (b != null) list.add(b);
        }
        if (list.isEmpty()) return null;

        List<List<BlockName>> perms = generatePermutations(list);
        Solution bestSol = null;
        int maxTotalScore = Integer.MIN_VALUE;

        for (List<BlockName> perm : perms) {
            Solution sol = solvePermutation(initialBoard, perm);
            if (sol != null && sol.score > maxTotalScore) {
                maxTotalScore = sol.score;
                bestSol = sol;
            }
        }
        return bestSol;
    }

    private static List<List<BlockName>> generatePermutations(List<BlockName> original) {
        if (original.isEmpty()) {
            List<List<BlockName>> result = new ArrayList<>();
            result.add(new ArrayList<>());
            return result;
        }
        BlockName firstElement = original.get(0);
        List<List<BlockName>> returnValue = new ArrayList<>();
        List<List<BlockName>> subList = generatePermutations(original.subList(1, original.size()));
        for (List<BlockName> currentList : subList) {
            for (int i = 0; i <= currentList.size(); i++) {
                List<BlockName> temp = new ArrayList<>(currentList);
                temp.add(i, firstElement);
                returnValue.add(temp);
            }
        }
        return returnValue;
    }

    private static Solution solvePermutation(Board board, List<BlockName> blocks) {
        return solveRecursive(board, blocks, 0, new String[blocks.size()], 0);
    }

    private static Solution solveRecursive(Board currentBoard, List<BlockName> blocks, int index, String[] positions, int scoreAccum) {
        if (index == blocks.size()) {
            BlockName[] order = blocks.toArray(new BlockName[0]);
            return new Solution(order, positions.clone(), scoreAccum);
        }

        BlockName block = blocks.get(index);
        Solution best = null;
        int maxEval = Integer.MIN_VALUE;

        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                if (currentBoard.canPlace(r, c, block)) {
                    Board nextBoard = currentBoard.clone();
                    int lines = nextBoard.placeBlock(r, c, block);
                    int stepScore = evaluateBoard(nextBoard, lines);

                    positions[index] = "(" + r + "," + c + ")";
                    Solution res = solveRecursive(nextBoard, blocks, index + 1, positions, scoreAccum + stepScore);
                    if (res != null && res.score > maxEval) {
                        maxEval = res.score;
                        best = res;
                    }
                }
            }
        }
        return best;
    }

    public static int evaluateBoard(Board board, int linesCleared) {
        int score = 0;
        score += linesCleared * 500;

        int occupiedCount = 0;
        int holes = 0;

        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                if (board.table[r][c]) {
                    occupiedCount++;
                } else {
                    // Check if enclosed hole
                    boolean top = (r > 0 && board.table[r - 1][c]);
                    boolean bot = (r < 7 && board.table[r + 1][c]);
                    boolean left = (c > 0 && board.table[r][c - 1]);
                    boolean right = (c < 7 && board.table[r][c + 1]);
                    if ((top && bot) || (left && right)) {
                        holes++;
                    }
                }
            }
        }

        score -= occupiedCount * 10;
        score -= holes * 40;

        // Big square 3x3 bonus check
        if (board.canPlace(2, 2, BlockName.SQUARE_3) || board.canPlace(3, 3, BlockName.SQUARE_3)) {
            score += 150;
        }

        return score;
    }
}
