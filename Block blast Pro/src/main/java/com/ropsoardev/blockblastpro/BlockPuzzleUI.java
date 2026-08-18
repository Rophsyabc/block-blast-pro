package com.ropsoardev.blockblastpro;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class BlockPuzzleUI extends JFrame {

    private GameController game;
    private BoardPanel boardPanel;
    private JPanel handPanel;
    private JLabel scoreLabel;
    private JLabel bestLabel;
    private JLabel streakLabel;
    private JLabel statusLabel;

    private boolean editMode = false;
    private Theme currentTheme = Theme.DARK;
    private Solution bestSequence = null;

    private static final String SAVE_FILE = "save_game.dat";

    public BlockPuzzleUI() {
        super("Block Blast Pro");
        new BlockDecoder();
        game = new GameController();

        initUI();
        loadGame();
        updateUI();

        setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                saveGame();
                System.exit(0);
            }
        });

        pack();
        setLocationRelativeTo(null);
        setResizable(false);
        setVisible(true);
    }

    private void initUI() {
        setLayout(new BorderLayout(10, 10));
        getContentPane().setBackground(new Color(currentTheme.getDarkBg()));

        // --- Menu Bar ---
        JMenuBar menuBar = new JMenuBar();
        JMenu gameMenu = new JMenu("Game");
        JMenuItem newItem = new JMenuItem("New Game");
        newItem.addActionListener(e -> startNewGame());
        JMenuItem soundItem = new JMenuItem("Toggle Sound");
        soundItem.addActionListener(e -> {
            SoundManager.toggleSound();
            statusLabel.setText(SoundManager.isEnabled() ? "Sound enabled." : "Sound muted.");
        });
        JMenuItem editItem = new JMenuItem("Toggle Edit Mode");
        editItem.addActionListener(e -> {
            editMode = !editMode;
            statusLabel.setText(editMode ? "EDIT MODE: Click board cells to toggle." : "PLAY MODE: Click pieces and board.");
            boardPanel.repaint();
        });
        JMenuItem statsItem = new JMenuItem("Stats");
        statsItem.addActionListener(e -> showStats());

        gameMenu.add(newItem);
        gameMenu.add(soundItem);
        gameMenu.add(editItem);
        gameMenu.add(statsItem);

        JMenu themeMenu = new JMenu("Theme");
        for (Theme t : Theme.values()) {
            JMenuItem tItem = new JMenuItem(t.getDisplayName());
            tItem.addActionListener(e -> applyTheme(t));
            themeMenu.add(tItem);
        }

        menuBar.add(gameMenu);
        menuBar.add(themeMenu);
        setJMenuBar(menuBar);

        // --- Top Stats Banner ---
        JPanel topPanel = new JPanel(new GridLayout(1, 3, 10, 0));
        topPanel.setBackground(new Color(currentTheme.getPanelBg()));
        topPanel.setBorder(new EmptyBorder(10, 15, 10, 15));

        scoreLabel = createStatLabel("SCORE", "0", Color.WHITE);
        bestLabel = createStatLabel("BEST", "0", new Color(0xF1C40F));
        streakLabel = createStatLabel("STREAK", "0x", new Color(0xE74C3C));

        topPanel.add(scoreLabel);
        topPanel.add(bestLabel);
        topPanel.add(streakLabel);

        add(topPanel, BorderLayout.NORTH);

        // --- Center Board & Hand ---
        JPanel centerContainer = new JPanel();
        centerContainer.setLayout(new BoxLayout(centerContainer, BoxLayout.Y_AXIS));
        centerContainer.setBackground(new Color(currentTheme.getDarkBg()));
        centerContainer.setBorder(new EmptyBorder(10, 15, 10, 15));

        boardPanel = new BoardPanel();
        centerContainer.add(boardPanel);
        centerContainer.add(Box.createVerticalStrut(15));

        handPanel = new JPanel(new GridLayout(1, 3, 10, 0));
        handPanel.setBackground(new Color(currentTheme.getPanelBg()));
        handPanel.setPreferredSize(new Dimension(400, 100));
        centerContainer.add(handPanel);

        add(centerContainer, BorderLayout.CENTER);

        // --- Bottom Action & Status ---
        JPanel bottomPanel = new JPanel(new BorderLayout());
        bottomPanel.setBackground(new Color(currentTheme.getPanelBg()));
        bottomPanel.setBorder(new EmptyBorder(10, 15, 10, 15));

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
        btnPanel.setOpaque(false);

        JButton hintBtn = createButton("💡 AI Hint", new Color(0xF39C12));
        hintBtn.addActionListener(e -> showHint());

        JButton autoBtn = createButton("🤖 Auto Move", new Color(0x2ECC71));
        autoBtn.addActionListener(e -> makeAutoMove());

        JButton solveBtn = createButton("🔍 Solve Hand", new Color(0x9B59B6));
        solveBtn.addActionListener(e -> showHint());

        btnPanel.add(hintBtn);
        btnPanel.add(autoBtn);
        btnPanel.add(solveBtn);

        statusLabel = new JLabel("Click or drag a piece into the board to score.", SwingConstants.CENTER);
        statusLabel.setForeground(Color.LIGHT_GRAY);
        statusLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));
        statusLabel.setBorder(new EmptyBorder(8, 0, 0, 0));

        bottomPanel.add(btnPanel, BorderLayout.CENTER);
        bottomPanel.add(statusLabel, BorderLayout.SOUTH);

        add(bottomPanel, BorderLayout.SOUTH);
    }

    private JLabel createStatLabel(String title, String val, Color valColor) {
        JLabel l = new JLabel("<html><center><small style='color:#888;'>" + title + "</small><br><b><font size='+1' color='" + toHex(valColor) + "'>" + val + "</font></b></center></html>", SwingConstants.CENTER);
        return l;
    }

    private String toHex(Color c) {
        return String.format("#%02x%02x%02x", c.getRed(), c.getGreen(), c.getBlue());
    }

    private JButton createButton(String text, Color bg) {
        JButton b = new JButton(text);
        b.setBackground(bg);
        b.setForeground(Color.WHITE);
        b.setFont(new Font("SansSerif", Font.BOLD, 12));
        b.setFocusPainted(false);
        b.setBorder(BorderFactory.createEmptyBorder(6, 12, 6, 12));
        return b;
    }

    private void applyTheme(Theme t) {
        currentTheme = t;
        getContentPane().setBackground(new Color(t.getDarkBg()));
        repaint();
    }

    private void startNewGame() {
        int opt = JOptionPane.showConfirmDialog(this, "Start a new game?", "Confirm", JOptionPane.YES_NO_OPTION);
        if (opt == JOptionPane.YES_OPTION) {
            game.startNewGame();
            bestSequence = null;
            saveGame();
            updateUI();
        }
    }

    private void showStats() {
        String msg = String.format("High Score: %d\nMax Streak: %dx\nTotal Blocks: %d",
                game.getHighScore(), game.getMaxStreak(), game.getTotalBlocksPlaced());
        JOptionPane.showMessageDialog(this, msg, "Statistics", JOptionPane.INFORMATION_MESSAGE);
    }

    private void saveGame() {
        try (PrintWriter pw = new PrintWriter(new FileWriter(SAVE_FILE))) {
            pw.println(game.serialize());
        } catch (Exception ignored) {}
    }

    private void loadGame() {
        File f = new File(SAVE_FILE);
        if (f.exists()) {
            try (BufferedReader br = new BufferedReader(new FileReader(f))) {
                String line = br.readLine();
                if (line != null) game.deserialize(line);
            } catch (Exception ignored) {}
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
            if (!used[i]) unusedBlocks[idx++] = hand[i];
        }

        bestSequence = Main.searchSequence(game.getBoard(), unusedBlocks);
        if (bestSequence != null && bestSequence.order != null && bestSequence.order.length > 0) {
            String pos = bestSequence.mostTopLefts[0];
            int r = Integer.parseInt(pos.substring(1, pos.indexOf(',')));
            int c = Integer.parseInt(pos.substring(pos.indexOf(',') + 1, pos.indexOf(')')));
            boardPanel.setHint(new Main.MoveHint(r, c, (BlockName) bestSequence.order[0], 0, 0));
            statusLabel.setText("Best Move: " + bestSequence.order[0] + " at (" + r + "," + c + ")");
        } else {
            Main.MoveHint hint = Main.findBestSingleMove(game.getBoard(), hand, used);
            boardPanel.setHint(hint);
            if (hint != null) statusLabel.setText("Single Move: " + hint.block + " at (" + hint.row + "," + hint.col + ")");
        }
    }

    private void makeAutoMove() {
        if (game.isGameOver()) return;
        if (bestSequence == null) showHint();

        if (bestSequence != null && bestSequence.order != null && bestSequence.order.length > 0) {
            BlockName block = (BlockName) bestSequence.order[0];
            String pos = bestSequence.mostTopLefts[0];
            int r = Integer.parseInt(pos.substring(1, pos.indexOf(',')));
            int c = Integer.parseInt(pos.substring(pos.indexOf(',') + 1, pos.indexOf(')')));

            BlockName[] hand = game.getHand();
            boolean[] used = game.getPieceUsed();
            int pIdx = -1;
            for (int i = 0; i < 3; i++) {
                if (!used[i] && hand[i] == block) {
                    pIdx = i;
                    break;
                }
            }

            if (pIdx != -1) {
                game.playPiece(pIdx, r, c);
                SoundManager.playPlace();

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
                    boardPanel.setHint(new Main.MoveHint(nr, nc, (BlockName) bestSequence.order[0], 0, 0));
                } else {
                    bestSequence = null;
                    boardPanel.setHint(null);
                }

                saveGame();
                updateUI();
                if (game.isGameOver()) {
                    SoundManager.playGameOver();
                    JOptionPane.showMessageDialog(this, "GAME OVER!\nScore: " + game.getScore(), "Game Over", JOptionPane.INFORMATION_MESSAGE);
                }
            }
        }
    }

    private void updateUI() {
        scoreLabel.setText("<html><center><small style='color:#888;'>SCORE</small><br><b><font size='+1' color='#FFFFFF'>" + game.getScore() + "</font></b></center></html>");
        bestLabel.setText("<html><center><small style='color:#888;'>BEST</small><br><b><font size='+1' color='#F1C40F'>" + game.getHighScore() + "</font></b></center></html>");
        streakLabel.setText("<html><center><small style='color:#888;'>STREAK</small><br><b><font size='+1' color='#E74C3C'>" + game.getStreakCount() + "x</font></b></center></html>");

        handPanel.removeAll();
        BlockName[] hand = game.getHand();
        boolean[] used = game.getPieceUsed();

        for (int i = 0; i < 3; i++) {
            PieceCard card = new PieceCard(hand[i], i, used[i]);
            handPanel.add(card);
        }

        handPanel.revalidate();
        handPanel.repaint();
        boardPanel.repaint();
    }

    private class PieceCard extends JPanel {
        private BlockName block;
        private int index;
        private boolean used;

        public PieceCard(BlockName block, int index, boolean used) {
            this.block = block;
            this.index = index;
            this.used = used;
            setBackground(new Color(currentTheme.getPanelBg()));
            setBorder(BorderFactory.createLineBorder(new Color(0x334466), 1));
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            if (used || block == null) return;

            Graphics2D g2 = (Graphics2D) g;
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            boolean[][] shape = BlockDecoder.blockMap.get(block);
            if (shape == null) return;

            int rows = shape.length;
            int cols = shape[0].length;
            int cellW = getWidth() / (Math.max(cols, rows) + 1);
            int startX = (getWidth() - cols * cellW) / 2;
            int startY = (getHeight() - rows * cellW) / 2;

            g2.setColor(new Color(Board.getBlockColor(block)));
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    if (shape[r][c]) {
                        g2.fillRoundRect(startX + c * cellW + 2, startY + r * cellW + 2, cellW - 4, cellW - 4, 6, 6);
                    }
                }
            }
        }
    }

    private class BoardPanel extends JPanel {
        private Main.MoveHint hint;

        public BoardPanel() {
            setPreferredSize(new Dimension(360, 360));
            setBackground(new Color(currentTheme.getBoardBg()));

            addMouseListener(new MouseAdapter() {
                @Override
                public void mousePressed(MouseEvent e) {
                    int cellSize = getWidth() / 8;
                    int r = e.getY() / cellSize;
                    int c = e.getX() / cellSize;

                    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                        if (editMode) {
                            Board b = game.getBoard();
                            b.table[r][c] = !b.table[r][c];
                            b.colorTable[r][c] = b.table[r][c] ? 0xFF3498DB : 0;
                            repaint();
                            saveGame();
                        }
                    }
                }
            });
        }

        public void setHint(Main.MoveHint hint) {
            this.hint = hint;
            repaint();
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2 = (Graphics2D) g;
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            int cellSize = getWidth() / 8;
            Board board = game.getBoard();

            for (int r = 0; r < 8; r++) {
                for (int c = 0; c < 8; c++) {
                    int x = c * cellSize + 2;
                    int y = r * cellSize + 2;
                    int w = cellSize - 4;
                    int h = cellSize - 4;

                    if (board.table[r][c]) {
                        g2.setColor(new Color(board.colorTable[r][c]));
                        g2.fillRoundRect(x, y, w, h, 8, 8);
                    } else {
                        g2.setColor(new Color(0x232A3B));
                        g2.fillRoundRect(x, y, w, h, 8, 8);
                    }
                }
            }

            if (hint != null) {
                boolean[][] s = BlockDecoder.blockMap.get(hint.block);
                if (s != null) {
                    g2.setColor(new Color(241, 196, 15, 180));
                    for (int i = 0; i < s.length; i++) {
                        for (int j = 0; j < s[0].length; j++) {
                            if (s[i][j]) {
                                int x = (hint.col + j) * cellSize + 2;
                                int y = (hint.row + i) * cellSize + 2;
                                g2.fillRoundRect(x, y, cellSize - 4, cellSize - 4, 8, 8);
                            }
                        }
                    }
                }
            }
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(BlockPuzzleUI::new);
    }
}
