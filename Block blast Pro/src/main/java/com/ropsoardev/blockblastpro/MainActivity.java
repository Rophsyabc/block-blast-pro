package com.ropsoardev.blockblastpro;

import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Bundle;
import android.os.Vibrator;
import android.view.DragEvent;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private GameController game;
    private BoardView boardView;
    private TextView scoreText;
    private TextView bestText;
    private TextView streakText;
    private LinearLayout handContainer;
    private Vibrator vibrator;

    private boolean editMode = false;
    private int themeIndex = 0;
    private Solution bestSequence = null;

    // Drag state
    private int dragPieceIdx = -1;
    private int dragR = -1;
    private int dragC = -1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        new BlockDecoder();
        game = new GameController();
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        AndroidSoundManager.init(this);

        scoreText = findViewById(R.id.score_val);
        bestText = findViewById(R.id.best_val);
        streakText = findViewById(R.id.streak_val);
        handContainer = findViewById(R.id.hand_container);

        FrameLayout boardContainer = findViewById(R.id.board_container);
        boardView = new BoardView(this);
        boardContainer.addView(boardView);

        // Header Menu
        findViewById(R.id.menu_btn).setOnClickListener(this::showPopupMenu);

        // Action Buttons
        findViewById(R.id.hint_btn).setOnClickListener(v -> showHint());
        findViewById(R.id.auto_btn).setOnClickListener(v -> makeAutoMove());
        findViewById(R.id.solve_btn).setOnClickListener(v -> showHint());

        // Initialize Google Mobile Ads (AdMob)
        AdManager.getInstance().init(this);

        loadGame();
        updateUI();
    }

    private void showPopupMenu(View v) {
        PopupMenu popup = new PopupMenu(this, v);
        popup.getMenuInflater().inflate(R.menu.game_menu, popup.getMenu());

        // Dynamic titles for stateful items
        popup.getMenu().findItem(R.id.menu_sound).setTitle(AndroidSoundManager.isEnabled() ? "🔊 Sound: ON" : "🔇 Sound: OFF");
        popup.getMenu().findItem(R.id.menu_edit).setTitle(editMode ? "🛠️ Edit Mode: ON" : "✏️ Edit Mode: OFF");

        popup.setOnMenuItemClickListener(item -> {
            int id = item.getItemId();
            if (id == R.id.menu_new_game) {
                startNewGame();
                return true;
            } else if (id == R.id.menu_sound) {
                AndroidSoundManager.toggleSound();
                Toast.makeText(this, AndroidSoundManager.isEnabled() ? "Sound Enabled" : "Sound Muted", Toast.LENGTH_SHORT).show();
                return true;
            } else if (id == R.id.menu_theme) {
                cycleTheme();
                return true;
            } else if (id == R.id.menu_edit) {
                toggleEditMode();
                return true;
            } else if (id == R.id.menu_stats) {
                showStats();
                return true;
            }
            return false;
        });
        popup.show();
    }

    private void cycleTheme() {
        Theme[] themes = Theme.values();
        themeIndex = (themeIndex + 1) % themes.length;
        applyTheme(themes[themeIndex]);
    }

    private void applyTheme(Theme theme) {
        View mainView = findViewById(R.id.main_view);
        if (mainView != null) mainView.setBackgroundColor(theme.getDarkBg());

        View statsBanner = findViewById(R.id.stats_banner);
        if (statsBanner != null) statsBanner.setBackgroundColor(theme.getPanelBg());

        View handSection = findViewById(R.id.hand_section);
        if (handSection != null) handSection.setBackgroundColor(theme.getPanelBg());

        View boardContainer = findViewById(R.id.board_container);
        if (boardContainer != null) boardContainer.setBackgroundColor(theme.getBoardBg());

        boardView.invalidate();
    }

    private void toggleEditMode() {
        editMode = !editMode;
        Toast.makeText(this, editMode ? "Edit Mode Enabled" : "Play Mode Enabled", Toast.LENGTH_SHORT).show();
    }

    private void showStats() {
        String stats = String.format(
            "High Score: %d\n" +
            "Max Streak: %dx\n" +
            "Total Blocks Placed: %d",
            game.getHighScore(),
            game.getMaxStreak(),
            game.getTotalBlocksPlaced()
        );
        new AlertDialog.Builder(this)
                .setTitle("Player Statistics")
                .setMessage(stats)
                .setPositiveButton("Close", null)
                .show();
    }

    private void startNewGame() {
        new AlertDialog.Builder(this)
                .setTitle("New Game")
                .setMessage("Start a fresh game? Your current progress will be lost.")
                .setPositiveButton("Yes", (dialog, which) -> {
                    game.startNewGame();
                    bestSequence = null;
                    saveGame();
                    updateUI();
                })
                .setNegativeButton("No", null)
                .show();
    }

    private void reviveGame() {
        game.revive();
        AndroidSoundManager.playClear();
        Toast.makeText(this, "💥 Revived! 4 center cells cleared!", Toast.LENGTH_LONG).show();
        saveGame();
        updateUI();
    }

    private void saveGame() {
        SharedPreferences prefs = getSharedPreferences("BlockBlastPro", MODE_PRIVATE);
        prefs.edit().putString("save_state", game.serialize()).apply();
    }

    private void loadGame() {
        SharedPreferences prefs = getSharedPreferences("BlockBlastPro", MODE_PRIVATE);
        String data = prefs.getString("save_state", null);
        if (data != null) {
            game.deserialize(data);
        }
    }

    private void showHint() {
        if (game.isGameOver()) return;

        BlockName[] hand = game.getHand();
        boolean[] used = game.getPieceUsed();

        int unusedCount = 0;
        for (boolean u : used) if (!u) unusedCount++;
        if (unusedCount == 0) return;

        BlockName[] unusedBlocks = new BlockName[unusedCount];
        int idx = 0;
        for (int i = 0; i < 3; i++) {
            if (!used[i]) {
                unusedBlocks[idx++] = hand[i];
            }
        }

        bestSequence = Main.searchSequence(game.getBoard(), unusedBlocks);
        if (bestSequence != null && bestSequence.order != null && bestSequence.order.length > 0) {
            String pos = bestSequence.mostTopLefts[0];
            int r = Integer.parseInt(pos.substring(1, pos.indexOf(',')));
            int c = Integer.parseInt(pos.substring(pos.indexOf(',') + 1, pos.indexOf(')')));
            boardView.setHint(new Main.MoveHint(r, c, (BlockName) bestSequence.order[0], 0, 0));
        } else {
            Main.MoveHint hint = Main.findBestSingleMove(game.getBoard(), hand, used);
            boardView.setHint(hint);
        }
    }

    private void makeAutoMove() {
        if (game.isGameOver()) return;

        if (bestSequence == null) {
            showHint();
        }

        if (bestSequence != null && bestSequence.order != null && bestSequence.order.length > 0) {
            BlockName block = (BlockName) bestSequence.order[0];
            String pos = bestSequence.mostTopLefts[0];
            int r = Integer.parseInt(pos.substring(1, pos.indexOf(',')));
            int c = Integer.parseInt(pos.substring(pos.indexOf(',') + 1, pos.indexOf(')')));

            BlockName[] hand = game.getHand();
            boolean[] used = game.getPieceUsed();
            int pieceIdx = -1;
            for (int i = 0; i < 3; i++) {
                if (!used[i] && hand[i] == block) {
                    pieceIdx = i;
                    break;
                }
            }

            if (pieceIdx != -1) {
                game.playPiece(pieceIdx, r, c);
                vibrate(100);
                AndroidSoundManager.playPlace();
                
                // Shift sequence
                if (bestSequence.order.length > 1) {
                    Solution newSeq = new Solution();
                    newSeq.order = new BlockName[bestSequence.order.length - 1];
                    newSeq.mostTopLefts = new String[bestSequence.order.length - 1];
                    for (int i = 1; i < bestSequence.order.length; i++) {
                        newSeq.order[i - 1] = bestSequence.order[i];
                        newSeq.mostTopLefts[i - 1] = bestSequence.mostTopLefts[i];
                    }
                    bestSequence = newSeq;
                    String nPos = bestSequence.mostTopLefts[0];
                    int nr = Integer.parseInt(nPos.substring(1, nPos.indexOf(',')));
                    int nc = Integer.parseInt(nPos.substring(nPos.indexOf(',') + 1, nPos.indexOf(')')));
                    boardView.setHint(new Main.MoveHint(nr, nc, (BlockName) bestSequence.order[0], 0, 0));
                } else {
                    bestSequence = null;
                    boardView.setHint(null);
                }
                
                saveGame();
                updateUI();
                if (game.isGameOver()) {
                    boardView.showGameOverDialog();
                }
            } else {
                bestSequence = null;
            }
        }
    }

    private void vibrate(int ms) {
        if (vibrator != null && vibrator.hasVibrator()) {
            vibrator.vibrate(ms);
        }
    }

    private void updateUI() {
        scoreText.setText(String.valueOf(game.getScore()));
        bestText.setText(String.valueOf(game.getHighScore()));
        streakText.setText(game.getStreakCount() + "x");
        
        handContainer.removeAllViews();
        BlockName[] hand = game.getHand();
        boolean[] used = game.getPieceUsed();
        
        for (int i = 0; i < 3; i++) {
            HandPieceView pieceView = new HandPieceView(this, hand[i], i, used[i]);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1.0f);
            lp.setMargins(8, 0, 8, 0);
            handContainer.addView(pieceView, lp);
        }
        
        boardView.invalidate();
    }

    /**
     * View representing a block in the hand
     */
    private class HandPieceView extends View {
        private BlockName block;
        private int index;
        private boolean used;
        private Paint paint;

        public HandPieceView(Context context, BlockName block, int index, boolean used) {
            super(context);
            this.block = block;
            this.index = index;
            this.used = used;
            this.paint = new Paint(Paint.ANTI_ALIAS_FLAG);

            if (!used && block != null) {
                setOnTouchListener((v, event) -> {
                    if (event.getAction() == MotionEvent.ACTION_DOWN) {
                        View.DragShadowBuilder shadow = new View.DragShadowBuilder(v);
                        v.startDragAndDrop(null, shadow, index, 0);
                        return true;
                    }
                    return false;
                });
            }
        }

        @Override
        protected void onDraw(Canvas canvas) {
            if (used || block == null) return;

            boolean[][] shape = BlockDecoder.blockMap.get(block);
            if (shape == null) return;

            int rows = shape.length;
            int cols = shape[0].length;

            int cellW = getWidth() / (Math.max(cols, rows) + 1);
            int startX = (getWidth() - cols * cellW) / 2;
            int startY = (getHeight() - rows * cellW) / 2;

            paint.setColor(Board.getBlockColor(block));
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    if (shape[r][c]) {
                        RectF rect = new RectF(
                            startX + c * cellW + 2, 
                            startY + r * cellW + 2, 
                            startX + (c + 1) * cellW - 2, 
                            startY + (r + 1) * cellW - 2
                        );
                        canvas.drawRoundRect(rect, 4, 4, paint);
                    }
                }
            }
        }
    }

    /**
     * View representing the 8x8 Board
     */
    public class BoardView extends View {
        private Paint paint;
        private Main.MoveHint currentHint;

        public BoardView(Context context) {
            super(context);
            paint = new Paint(Paint.ANTI_ALIAS_FLAG);

            setOnDragListener((v, event) -> {
                int action = event.getAction();
                int cellSize = getWidth() / 8;

                switch (action) {
                    case DragEvent.ACTION_DRAG_STARTED:
                        dragPieceIdx = (int) event.getLocalState();
                        return true;

                    case DragEvent.ACTION_DRAG_LOCATION:
                        if (dragPieceIdx != -1) {
                            BlockName b = game.getHand()[dragPieceIdx];
                            boolean[][] s = BlockDecoder.blockMap.get(b);
                            int pRows = s != null ? s.length : 1;
                            int pCols = s != null ? s[0].length : 1;
                            dragR = (int) (event.getY() / cellSize) - (pRows / 2);
                            dragC = (int) (event.getX() / cellSize) - (pCols / 2);
                            invalidate();
                        }
                        return true;

                    case DragEvent.ACTION_DRAG_ENDED:
                        dragPieceIdx = -1;
                        dragR = -1;
                        dragC = -1;
                        invalidate();
                        return true;

                    case DragEvent.ACTION_DROP:
                        int pieceIdx = (int) event.getLocalState();
                        BlockName b = game.getHand()[pieceIdx];
                        boolean[][] s = BlockDecoder.blockMap.get(b);
                        int pRows = s != null ? s.length : 1;
                        int pCols = s != null ? s[0].length : 1;
                        int r = (int) (event.getY() / cellSize) - (pRows / 2);
                        int c = (int) (event.getX() / cellSize) - (pCols / 2);
                        
                        if (game.playPiece(pieceIdx, r, c)) {
                            vibrate(100);
                            AndroidSoundManager.playPlace();
                            currentHint = null;
                            bestSequence = null;
                            saveGame();
                            updateUI();
                            if (game.isGameOver()) {
                                showGameOverDialog();
                            }
                        } else {
                            Toast.makeText(getContext(), "Doesn't fit!", Toast.LENGTH_SHORT).show();
                        }
                        return true;
                }
                return true;
            });
        }

        public void showGameOverDialog() {
            AdManager.getInstance().onGameOver(MainActivity.this);
            new AlertDialog.Builder(MainActivity.this)
                    .setTitle("💀 GAME OVER")
                    .setMessage("Final Score: " + game.getScore() + "\nHigh Score: " + game.getHighScore())
                    .setPositiveButton("🎬 Revive & Blast (Watch Ad)", (dialog, which) -> {
                        AdManager.getInstance().showRewardedAd(MainActivity.this, MainActivity.this::reviveGame);
                    })
                    .setNegativeButton("Play Again", (dialog, which) -> {
                        startNewGame();
                    })
                    .setCancelable(false)
                    .show();
        }

        public void setHint(Main.MoveHint hint) {
            this.currentHint = hint;
            invalidate();
        }

        @Override
        public boolean onTouchEvent(MotionEvent event) {
            if (editMode && event.getAction() == MotionEvent.ACTION_DOWN) {
                int cellSize = getWidth() / 8;
                int r = (int) (event.getY() / cellSize);
                int c = (int) (event.getX() / cellSize);
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    Board board = game.getBoard();
                    board.table[r][c] = !board.table[r][c];
                    board.colorTable[r][c] = board.table[r][c] ? 0xFF3498DB : 0;
                    invalidate();
                    saveGame();
                }
                return true;
            }
            return super.onTouchEvent(event);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            int cellSize = getWidth() / 8;
            Board board = game.getBoard();
            
            for (int r = 0; r < 8; r++) {
                for (int c = 0; c < 8; c++) {
                    RectF rect = new RectF(c * cellSize + 2, r * cellSize + 2, (c + 1) * cellSize - 2, (r + 1) * cellSize - 2);
                    
                    if (board.table[r][c]) {
                        paint.setColor(board.colorTable[r][c]);
                        canvas.drawRoundRect(rect, 8, 8, paint);
                    } else {
                        paint.setColor(0xFF232A3B);
                        canvas.drawRoundRect(rect, 8, 8, paint);
                    }
                }
            }

            // Draw AI Hint
            if (currentHint != null) {
                paint.setColor(0xAAf1c40f);
                boolean[][] shape = BlockDecoder.blockMap.get(currentHint.block);
                if (shape != null) {
                    for (int i = 0; i < shape.length; i++) {
                        for (int j = 0; j < shape[0].length; j++) {
                            if (shape[i][j]) {
                                RectF rect = new RectF(
                                    (currentHint.col + j) * cellSize + 2, 
                                    (currentHint.row + i) * cellSize + 2, 
                                    (currentHint.col + j + 1) * cellSize - 2, 
                                    (currentHint.row + i + 1) * cellSize - 2
                                );
                                canvas.drawRoundRect(rect, 8, 8, paint);
                            }
                        }
                    }
                }
            }

            // Draw Drag Preview
            if (dragPieceIdx != -1 && dragR != -1 && dragC != -1) {
                BlockName dragBlock = game.getHand()[dragPieceIdx];
                boolean[][] dragShape = BlockDecoder.blockMap.get(dragBlock);
                if (dragShape != null) {
                    boolean canPlace = game.getBoard().canPlace(dragR, dragC, dragBlock);
                    paint.setColor(canPlace ? 0x882ECC71 : 0x88E74C3C);
                    for (int i = 0; i < dragShape.length; i++) {
                        for (int j = 0; j < dragShape[0].length; j++) {
                            if (dragShape[i][j]) {
                                int tr = dragR + i;
                                int tc = dragC + j;
                                if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
                                    RectF rect = new RectF(
                                        tc * cellSize + 2, 
                                        tr * cellSize + 2, 
                                        (tc + 1) * cellSize - 2, 
                                        (tr + 1) * cellSize - 2
                                    );
                                    canvas.drawRoundRect(rect, 8, 8, paint);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
