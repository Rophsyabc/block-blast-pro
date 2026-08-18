package com.ropsoardev.blockblastpro;

public class GameController {
    private Board board;
    private BlockName[] hand;
    private boolean[] pieceUsed;
    private int score;
    private int highScore;
    private int streakCount;
    private int maxStreak;
    private int totalBlocksPlaced;
    private boolean isGameOver;

    public GameController() {
        this.board = new Board();
        this.hand = new BlockName[3];
        this.pieceUsed = new boolean[3];
        this.score = 0;
        this.highScore = 0;
        this.streakCount = 0;
        this.maxStreak = 0;
        this.totalBlocksPlaced = 0;
        this.isGameOver = false;
        startNewGame();
    }

    public void startNewGame() {
        this.board = new Board();
        this.score = 0;
        this.streakCount = 0;
        this.isGameOver = false;
        refillHand();
    }

    public void revive() {
        if (board != null) {
            for (int r = 2; r <= 5; r++) {
                for (int c = 2; c <= 5; c++) {
                    board.table[r][c] = false;
                    board.colorTable[r][c] = 0;
                }
            }
            isGameOver = false;
        }
    }

    public void refillHand() {
        for (int i = 0; i < 3; i++) {
            hand[i] = BlockName.getRandomBlock();
            pieceUsed[i] = false;
        }
        checkGameOver();
    }

    public boolean playPiece(int pieceIndex, int r, int c) {
        if (isGameOver || pieceIndex < 0 || pieceIndex >= 3 || pieceUsed[pieceIndex]) {
            return false;
        }

        BlockName block = hand[pieceIndex];
        if (!board.canPlace(r, c, block)) {
            return false;
        }

        // Calculate score for placement
        boolean[][] shape = BlockDecoder.blockMap.get(block);
        int cellsPlaced = 0;
        for (int i = 0; i < shape.length; i++) {
            for (int j = 0; j < shape[0].length; j++) {
                if (shape[i][j]) cellsPlaced++;
            }
        }

        int linesCleared = board.placeBlock(r, c, block);
        pieceUsed[pieceIndex] = true;
        totalBlocksPlaced++;

        // Base points for cells placed
        int moveScore = cellsPlaced * 10;

        // Scoring bonuses for line clears
        if (linesCleared > 0) {
            streakCount++;
            if (streakCount > maxStreak) maxStreak = streakCount;
            int lineBonus = linesCleared * 100 * (1 + (linesCleared - 1) * 2);
            int streakBonus = streakCount * 50;
            moveScore += lineBonus + streakBonus;
        } else {
            streakCount = 0;
        }

        score += moveScore;
        if (score > highScore) {
            highScore = score;
        }

        // Check if hand is fully used
        boolean handFinished = true;
        for (int i = 0; i < 3; i++) {
            if (!pieceUsed[i]) {
                handFinished = false;
                break;
            }
        }

        if (handFinished) {
            refillHand();
        } else {
            checkGameOver();
        }

        return true;
    }

    public boolean checkGameOver() {
        boolean anyPlaceable = false;
        for (int i = 0; i < 3; i++) {
            if (!pieceUsed[i] && hand[i] != null) {
                for (int r = 0; r < 8; r++) {
                    for (int c = 0; c < 8; c++) {
                        if (board.canPlace(r, c, hand[i])) {
                            anyPlaceable = true;
                            break;
                        }
                    }
                    if (anyPlaceable) break;
                }
            }
            if (anyPlaceable) break;
        }

        isGameOver = !anyPlaceable;
        return isGameOver;
    }

    public Board getBoard() { return board; }
    public BlockName[] getHand() { return hand; }
    public boolean[] getPieceUsed() { return pieceUsed; }
    public int getScore() { return score; }
    public int getHighScore() { return highScore; }
    public int getStreakCount() { return streakCount; }
    public int getMaxStreak() { return maxStreak; }
    public int getTotalBlocksPlaced() { return totalBlocksPlaced; }
    public boolean isGameOver() { return isGameOver; }

    public String serialize() {
        StringBuilder sb = new StringBuilder();
        sb.append(score).append(";").append(highScore).append(";").append(streakCount).append(";");
        for (int i = 0; i < 3; i++) {
            sb.append(hand[i] != null ? hand[i].name() : "NULL").append(",");
            sb.append(pieceUsed[i]).append(";");
        }
        for (int i = 0; i < 8; i++) {
            for (int j = 0; j < 8; j++) {
                sb.append(board.table[i][j] ? "1" : "0");
            }
            sb.append(",");
        }
        return sb.toString();
    }

    public void deserialize(String data) {
        if (data == null || data.isEmpty()) return;
        try {
            String[] parts = data.split(";");
            if (parts.length >= 7) {
                this.score = Integer.parseInt(parts[0]);
                this.highScore = Integer.parseInt(parts[1]);
                this.streakCount = Integer.parseInt(parts[2]);

                for (int i = 0; i < 3; i++) {
                    String[] pieceParts = parts[3 + i].split(",");
                    if (!pieceParts[0].equals("NULL")) {
                        this.hand[i] = BlockName.valueOf(pieceParts[0]);
                    }
                    this.pieceUsed[i] = Boolean.parseBoolean(pieceParts[1]);
                }

                String[] rowData = parts[6].split(",");
                for (int i = 0; i < Math.min(8, rowData.length); i++) {
                    String row = rowData[i];
                    for (int j = 0; j < Math.min(8, row.length()); j++) {
                        board.table[i][j] = (row.charAt(j) == '1');
                        board.colorTable[i][j] = board.table[i][j] ? 0xFF2980B9 : 0;
                    }
                }
                checkGameOver();
            }
        } catch (Exception e) {
            // Fallback on corrupt data
            startNewGame();
        }
    }
}
