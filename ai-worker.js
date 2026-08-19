// ============================================================
// Block Blast Pro — AI Solver Web Worker
// Runs the heavy search off the main thread to prevent UI jank.
// ============================================================

/* eslint-env worker */

// Block decoder must be self-contained (workers can't access main scope)
const BD = {
    SQUARE:                 { shape: [[1,1],[1,1]] },
    LARGE_SQUARE:           { shape: [[1,1,1],[1,1,1],[1,1,1]] },
    L:                      { shape: [[1,0],[1,0],[1,1]] },
    REVERSE_L:              { shape: [[0,1],[0,1],[1,1]] },
    UPSIDE_L:               { shape: [[1,1],[1,0],[1,0]] },
    REVERSE_UPSIDE_L:       { shape: [[1,1],[0,1],[0,1]] },
    BIG_L:                  { shape: [[1,0,0],[1,0,0],[1,1,1]] },
    REVERSE_BIG_L:          { shape: [[0,0,1],[0,0,1],[1,1,1]] },
    UPSIDE_BIG_L:           { shape: [[1,1,1],[1,0,0],[1,0,0]] },
    REVERSE_UPSIDE_BIG_L:   { shape: [[1,1,1],[0,0,1],[0,0,1]] },
    HORIZONTAL_L:           { shape: [[0,0,1],[1,1,1]] },
    T:                      { shape: [[1,1,1],[0,1,0]] },
    RIGHT_T:                { shape: [[1,0],[1,1],[1,0]] },
    LEFT_T:                 { shape: [[0,1],[1,1],[0,1]] },
    UP_T:                   { shape: [[0,1,0],[1,1,1]] },
    TOP_LEFT_CORNER:        { shape: [[1,1],[1,0]] },
    TOP_RIGHT_CORNER:       { shape: [[1,1],[0,1]] },
    BOTTOM_LEFT_CORNER:     { shape: [[1,0],[1,1]] },
    BOTTOM_RIGHT_CORNER:    { shape: [[0,1],[1,1]] },
    ONE:                    { shape: [[1]] },
    HORIZONTAL_TWO:         { shape: [[1,1]] },
    VERTICAL_TWO:           { shape: [[1],[1]] },
    HORIZONTAL_THREE:       { shape: [[1,1,1]] },
    VERTICAL_THREE:         { shape: [[1],[1],[1]] },
    HORIZONTAL_FOUR:        { shape: [[1,1,1,1]] },
    VERTICAL_FOUR:          { shape: [[1],[1],[1],[1]] },
    HORIZONTAL_FIVE:        { shape: [[1,1,1,1,1]] },
    VERTICAL_FIVE:          { shape: [[1],[1],[1],[1],[1]] },
    HORIZONTAL_SIX_PACK:    { shape: [[1,1,1],[1,1,1]] },
    VERTICAL_SIX_PACK:      { shape: [[1,1],[1,1],[1,1]] },
};

function canPlace(board, r, c, key) {
    const shape = BD[key].shape;
    if (r < 0 || c < 0 || r + shape.length > 8 || c + shape[0].length > 8) return false;
    for (let i = 0; i < shape.length; i++)
        for (let j = 0; j < shape[0].length; j++)
            if (shape[i][j] && board[r + i][c + j] !== null) return false;
    return true;
}

function simulate(board, r, c, key) {
    const nb = board.map(row => [...row]);
    const shape = BD[key].shape;
    for (let i = 0; i < shape.length; i++)
        for (let j = 0; j < shape[0].length; j++)
            if (shape[i][j]) nb[r + i][c + j] = key; // mark with key (not color)

    const rows = [], cols = [];
    for (let ri = 0; ri < 8; ri++) if (nb[ri].every(c => c !== null)) rows.push(ri);
    for (let ci = 0; ci < 8; ci++) {
        let f = true;
        for (let ri = 0; ri < 8; ri++) if (!nb[ri][ci]) { f = false; break; }
        if (f) cols.push(ci);
    }
    rows.forEach(ri => { for (let ci = 0; ci < 8; ci++) nb[ri][ci] = null; });
    cols.forEach(ci => { for (let ri = 0; ri < 8; ri++) nb[ri][ci] = null; });
    return { nb, lines: rows.length + cols.length };
}

function scoreBoard(board) {
    let occupied = 0, holes = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if (board[r][c]) { occupied++; continue; }
        let n = 0;
        if (r === 0 || board[r-1][c]) n++;
        if (r === 7 || board[r+1][c]) n++;
        if (c === 0 || board[r][c-1]) n++;
        if (c === 7 || board[r][c+1]) n++;
        if (n === 4) holes += 2;
        else if (n === 3) holes++;
    }
    return { occupied, holes };
}

function perms(arr) {
    if (arr.length <= 1) return [arr];
    return arr.flatMap((v, i) =>
        perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [v, ...p])
    );
}

function search(board, indices, hand, depth, path, best) {
    if (depth === indices.length) {
        let totalLines = 0;
        path.forEach(s => totalLines += s.lines);
        const fb = path[path.length - 1].nb;
        const { occupied, holes } = scoreBoard(fb);
        const score = (totalLines * 1000) - (occupied * 10) - (holes * 50);
        if (score > best.score) {
            best.score = score;
            best.seq = path.map(s => ({ pieceIdx: s.pieceIdx, r: s.r, c: s.c, lines: s.lines, blockKey: s.key }));
        }
        return;
    }

    const pieceIdx = indices[depth];
    const key = hand[pieceIdx];
    let found = false;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (canPlace(board, r, c, key)) {
                found = true;
                const { nb, lines } = simulate(board, r, c, key);
                path.push({ pieceIdx, r, c, key, lines, nb });
                search(nb, indices, hand, depth + 1, path, best);
                path.pop();
            }
        }
    }

    if (!found && path.length > 0) {
        let tl = 0, occ = 0;
        path.forEach(s => tl += s.lines);
        path[path.length-1].nb.forEach(row => row.forEach(c => { if (c) occ++; }));
        const score = (tl * 1000) - occ - 5000;
        if (score > best.score) {
            best.score = score;
            best.seq = path.map(s => ({ pieceIdx: s.pieceIdx, r: s.r, c: s.c, lines: s.lines, blockKey: s.key }));
        }
    }
}

/** Also compute best single move for hint */
function bestSingle(board, key) {
    let best = null, maxScore = -Infinity;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (canPlace(board, r, c, key)) {
                const { nb, lines } = simulate(board, r, c, key);
                const { occupied, holes } = scoreBoard(nb);
                const score = (lines * 100) - (occupied * 10) - (holes * 50);
                if (score > maxScore) {
                    maxScore = score;
                    best = { r, c, blockKey: key, score, lines, occupied, holes };
                }
            }
        }
    }
    return best;
}

// -------- Message Handler --------
self.onmessage = function(e) {
    const { type, board, hand, pieceUsed, selectedIndex } = e.data;

    if (type === 'hint') {
        const key = hand[selectedIndex];
        const result = key ? bestSingle(board, key) : null;
        self.postMessage({ type: 'hint', result });
        return;
    }

    if (type === 'solve') {
        const unusedIdx = pieceUsed.reduce((a, u, i) => { if (!u && hand[i]) a.push(i); return a; }, []);
        if (!unusedIdx.length) { self.postMessage({ type: 'solve', sequence: null }); return; }

        const best = { score: -Infinity, seq: null };
        for (const p of perms(unusedIdx)) {
            search(board, p, hand, 0, [], best);
        }
        self.postMessage({ type: 'solve', sequence: best.seq });
        return;
    }
};
