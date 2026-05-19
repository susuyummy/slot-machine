const SYMBOLS = [
    { key: 'diamond', img: '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg', label: '💎', name: '鑽石' },
    { key: 'star', img: '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg', label: '⭐', name: '星星' },
    { key: 'bell', img: 'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg', label: '🔔', name: '鈴鐺' },
    { key: 'grape', img: 'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg', label: '🍇', name: '葡萄' },
    { key: 'lemon', img: 'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg', label: '🍋', name: '檸檬' },
    { key: 'hamster', img: 'IMG_1538.JPG', label: '🐹', name: '倉鼠' }
];

const REEL_COUNT = 5;
const ROW_COUNT = 3;
const STORAGE_KEY = 'susu-slot-state-v3';
const START_BALANCE = 1000;
const MIN_BET = 10;
const MAX_BET = 200;
const BET_STEP = 10;

let state = {
    balance: START_BALANCE,
    bet: MIN_BET,
    freeSpins: 0,
    lastWin: 0,
    history: []
};

let board = createRandomBoard();
let isSpinning = false;
let isAutoSpinning = false;

const reels = Array.from({ length: REEL_COUNT }, (_, index) => document.getElementById(`reel${index + 1}`));
const balanceDisplay = document.getElementById('balance');
const lastWinDisplay = document.getElementById('last-win');
const freeSpinsDisplay = document.getElementById('free-spins');
const betInput = document.getElementById('bet');
const message = document.getElementById('message');
const spinButton = document.getElementById('spin-button');
const autoButton = document.getElementById('auto-button');
const maxBetButton = document.getElementById('max-bet-button');
const resetButton = document.getElementById('reset-button');
const betMinusButton = document.getElementById('bet-minus');
const betPlusButton = document.getElementById('bet-plus');
const lever = document.getElementById('lever');
const historyList = document.getElementById('history-list');
const machinePanel = document.querySelector('.game-panel');
const paylineOverlay = document.getElementById('payline-overlay');

init();

function init() {
    loadState();
    renderBoard(board);
    syncUI();
    bindEvents();
}

function bindEvents() {
    spinButton.addEventListener('click', () => spin());
    lever.addEventListener('click', () => spin());
    autoButton.addEventListener('click', toggleAutoSpin);
    resetButton.addEventListener('click', resetGame);
    maxBetButton.addEventListener('click', () => setBet(MAX_BET));
    betMinusButton.addEventListener('click', () => setBet(state.bet - BET_STEP));
    betPlusButton.addEventListener('click', () => setBet(state.bet + BET_STEP));
    betInput.addEventListener('change', () => setBet(Number(betInput.value)));
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Number.isFinite(saved.balance)) {
            state = {
                balance: clamp(saved.balance, 0, 9999999),
                bet: clampToStep(saved.bet || MIN_BET),
                freeSpins: clamp(saved.freeSpins || 0, 0, 99),
                lastWin: clamp(saved.lastWin || 0, 0, 9999999),
                history: Array.isArray(saved.history) ? saved.history.slice(0, 6) : []
            };
        }
    } catch {
        localStorage.removeItem(STORAGE_KEY);
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncUI() {
    balanceDisplay.textContent = state.balance;
    lastWinDisplay.textContent = state.lastWin;
    freeSpinsDisplay.textContent = state.freeSpins;
    betInput.value = state.bet;
    betMinusButton.disabled = state.bet <= MIN_BET || isSpinning;
    betPlusButton.disabled = state.bet >= MAX_BET || isSpinning;
    maxBetButton.disabled = state.bet >= MAX_BET || isSpinning;
    spinButton.disabled = isSpinning || (!state.freeSpins && state.balance < state.bet);
    lever.disabled = spinButton.disabled;
    autoButton.textContent = isAutoSpinning ? '停止自動' : '自動 10 轉';
    renderHistory();
    saveState();
}

function setBet(value) {
    state.bet = clampToStep(value);
    syncUI();
}

async function spin({ automatic = false } = {}) {
    if (isSpinning) return false;
    if (!state.freeSpins && state.balance < state.bet) {
        showMessage('餘額不足，請降低下注或重置遊戲。', 'danger');
        return false;
    }

    isSpinning = true;
    state.lastWin = 0;
    clearWinningLines();
    syncUI();
    pullLever();

    const isFreeSpin = state.freeSpins > 0;
    if (isFreeSpin) {
        state.freeSpins -= 1;
        showMessage('免費轉啟動！', 'info');
    } else {
        state.balance -= state.bet;
        showMessage(automatic ? '自動轉動中...' : '轉動中...', 'info');
    }

    board = await animateSpin();
    const result = evaluateBoard(board, state.bet);
    state.lastWin = result.totalWin;
    state.balance += result.totalWin;
    state.freeSpins += result.freeSpins;
    addHistory(result, isFreeSpin);
    renderBoard(board, result);
    renderWinningLines(result.lineWins);
    finishRound(result);

    isSpinning = false;
    syncUI();
    return true;
}

async function toggleAutoSpin() {
    if (isAutoSpinning) {
        isAutoSpinning = false;
        syncUI();
        return;
    }

    isAutoSpinning = true;
    syncUI();

    for (let count = 0; count < 10 && isAutoSpinning; count++) {
        const didSpin = await spin({ automatic: true });
        if (!didSpin || (!state.freeSpins && state.balance < state.bet)) break;
        await sleep(650);
    }

    isAutoSpinning = false;
    syncUI();
}

function resetGame() {
    state = {
        balance: START_BALANCE,
        bet: MIN_BET,
        freeSpins: 0,
        lastWin: 0,
        history: []
    };
    board = createRandomBoard();
    renderBoard(board);
    showMessage('已重置，新的運氣從這一局開始。', 'info');
    syncUI();
}

function pullLever() {
    lever.classList.remove('pulled');
    void lever.offsetWidth;
    lever.classList.add('pulled');
}

async function animateSpin() {
    const timers = [];

    reels.forEach((reel, reelIndex) => {
        reel.classList.add('spinning');
        timers[reelIndex] = setInterval(() => {
            const randomColumn = Array.from({ length: ROW_COUNT }, randomSymbolIndex);
            renderColumn(reelIndex, randomColumn);
        }, 80);
    });

    const finalBoard = createRandomBoard();

    for (let reelIndex = 0; reelIndex < REEL_COUNT; reelIndex++) {
        await sleep(420 + reelIndex * 170);
        clearInterval(timers[reelIndex]);
        reels[reelIndex].classList.remove('spinning');
        renderColumn(reelIndex, finalBoard[reelIndex]);
    }

    return finalBoard;
}

function createRandomBoard() {
    return Array.from({ length: REEL_COUNT }, () =>
        Array.from({ length: ROW_COUNT }, randomSymbolIndex)
    );
}

function randomSymbolIndex() {
    const weightedSymbols = [0, 1, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5];
    return weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
}

function renderBoard(nextBoard, highlight = {}) {
    const lineCells = highlight.lineCells || highlight.winningCells || new Set();
    const scatterCells = highlight.scatterCells || new Set();
    nextBoard.forEach((column, index) => renderColumn(index, column, lineCells, scatterCells));
}

function renderColumn(reelIndex, column, lineCells = new Set(), scatterCells = new Set()) {
    const inner = reels[reelIndex].querySelector('.reel-inner');
    inner.innerHTML = column.map((symbolIndex, rowIndex) => {
        const symbol = SYMBOLS[symbolIndex];
        const cellKey = `${reelIndex}-${rowIndex}`;
        const winClass = lineCells.has(cellKey) ? ' win' : '';
        const scatterClass = scatterCells.has(cellKey) ? ' scatter' : '';
        return `
            <div class="symbol-cell symbol-${symbol.key}${winClass}${scatterClass}" data-cell="${cellKey}">
                <img src="${symbol.img}" alt="${symbol.name}" title="${symbol.label} ${symbol.name}">
            </div>
        `;
    }).join('');
}

function evaluateBoard(currentBoard, bet) {
    let totalMultiplier = 0;
    const lineWins = findConnectedLineWins(currentBoard);
    const lineCells = new Set();
    const scatterCells = new Set();

    lineWins.forEach(win => {
        totalMultiplier += win.multiplier;
        for (let reelIndex = 0; reelIndex < win.count; reelIndex++) {
            lineCells.add(`${reelIndex}-${win.rows[reelIndex]}`);
        }
    });

    const scatter = countScatters(currentBoard);
    let freeSpins = 0;
    let bonusWin = 0;

    if (scatter.bell >= 3) {
        freeSpins += scatter.bell - 2;
    }

    if (scatter.star >= 3) {
        freeSpins += 2;
        bonusWin += bet * (scatter.star + 2);
        markScatterWins(currentBoard, 'star', scatterCells);
    }

    if (scatter.bell >= 3) {
        markScatterWins(currentBoard, 'bell', scatterCells);
    }

    const winningCells = new Set([...lineCells, ...scatterCells]);
    const lineWin = Math.round(bet * totalMultiplier);
    return {
        totalWin: lineWin + bonusWin,
        lineWin,
        bonusWin,
        lineWins,
        freeSpins,
        lineCells,
        scatterCells,
        winningCells
    };
}

function findConnectedLineWins(currentBoard) {
    return SYMBOLS
        .map((symbol, symbolIndex) => ({ symbol, symbolIndex }))
        .filter(({ symbol }) => !isScatterSymbol(symbol.key))
        .map(({ symbol, symbolIndex }) => getBestConnectedPath(currentBoard, symbol, symbolIndex))
        .filter(Boolean);
}

function getBestConnectedPath(currentBoard, symbol, symbolIndex) {
    let paths = [];

    for (let row = 0; row < ROW_COUNT; row++) {
        if (currentBoard[0][row] === symbolIndex) {
            paths.push([row]);
        }
    }

    if (!paths.length) return null;

    let bestPath = paths[0];

    for (let reelIndex = 1; reelIndex < REEL_COUNT; reelIndex++) {
        const nextPaths = [];

        paths.forEach(path => {
            const previousRow = path[path.length - 1];
            for (let row = 0; row < ROW_COUNT; row++) {
                const isAdjacent = Math.abs(row - previousRow) <= 1;
                if (isAdjacent && currentBoard[reelIndex][row] === symbolIndex) {
                    nextPaths.push([...path, row]);
                }
            }
        });

        if (!nextPaths.length) break;

        paths = nextPaths;
        const longestPath = paths.reduce((best, path) => path.length > best.length ? path : best, paths[0]);
        if (longestPath.length > bestPath.length) {
            bestPath = longestPath;
        }
    }

    const count = bestPath.length;
    const multiplier = getLineMultiplier(symbolIndex, count);
    if (!multiplier) return null;

    return {
        line: '相鄰路徑',
        rows: bestPath,
        symbol,
        count,
        multiplier
    };
}

function getLineMultiplier(symbolIndex, count) {
    const symbolKey = SYMBOLS[symbolIndex].key;
    if (isScatterSymbol(symbolKey)) return 0;
    const isDiamond = symbolKey === 'diamond';
    if (count >= 5) return isDiamond ? 100 : 40;
    if (count === 4) return isDiamond ? 20 : 10;
    if (count === 3) return isDiamond ? 5 : 2;
    return 0;
}

function isScatterSymbol(symbolKey) {
    return symbolKey === 'star' || symbolKey === 'bell';
}

function countScatters(currentBoard) {
    const counts = { star: 0, bell: 0 };
    currentBoard.flat().forEach(symbolIndex => {
        const key = SYMBOLS[symbolIndex].key;
        if (key === 'star' || key === 'bell') counts[key] += 1;
    });
    return counts;
}

function markScatterWins(currentBoard, symbolKey, winningCells) {
    currentBoard.forEach((column, reelIndex) => {
        column.forEach((symbolIndex, rowIndex) => {
            if (SYMBOLS[symbolIndex].key === symbolKey) {
                winningCells.add(`${reelIndex}-${rowIndex}`);
            }
        });
    });
}

function finishRound(result) {
    machinePanel.classList.remove('celebrate');
    void machinePanel.offsetWidth;

    if (result.totalWin > 0) {
        machinePanel.classList.add('celebrate');
        const lineText = result.lineWins.length
            ? `連線：${result.lineWins.map(win => `${win.symbol.label} ${win.count}連`).join('、')}`
            : '';
        const bonusText = result.bonusWin ? `Scatter Bonus +${result.bonusWin}` : '';
        const detailText = [lineText, bonusText].filter(Boolean).join('；');
        const freeText = result.freeSpins ? `，獲得 ${result.freeSpins} 次免費轉` : '';
        showMessage(`中獎！${detailText}，贏得 ${result.totalWin}${freeText}`, 'success');
        return;
    }

    if (result.freeSpins > 0) {
        showMessage(`Scatter：🔔 任意位置 3 個以上，獲得 ${result.freeSpins} 次免費轉。`, 'success');
        return;
    }

    showMessage('差一點點，下一轉說不定就回來了。', 'danger');
}

function addHistory(result, isFreeSpin) {
    const label = result.totalWin > 0
        ? `+${result.totalWin}`
        : result.freeSpins > 0
            ? `免費轉 +${result.freeSpins}`
            : '未中獎';
    state.history.unshift(`${isFreeSpin ? '免費轉' : `下注 ${state.bet}`}：${label}`);
    state.history = state.history.slice(0, 6);
}

function renderWinningLines(lineWins) {
    clearWinningLines();
    lineWins.forEach(win => {
        const points = [];
        for (let reelIndex = 0; reelIndex < win.count; reelIndex++) {
            const x = ((reelIndex + 0.5) / REEL_COUNT) * 100;
            const y = ((win.rows[reelIndex] + 0.5) / ROW_COUNT) * 100;
            points.push(`${x},${y}`);
        }

        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', points.join(' '));
        paylineOverlay.appendChild(polyline);
    });
}

function clearWinningLines() {
    paylineOverlay.replaceChildren();
}

function renderHistory() {
    historyList.innerHTML = state.history.length
        ? state.history.map(item => `<li>${item}</li>`).join('')
        : '<li>尚未開始</li>';
}

function showMessage(text, tone = 'info') {
    const colors = {
        info: '#f8cf5a',
        success: '#49c47a',
        danger: '#ff6b7a'
    };
    message.textContent = text;
    message.style.color = colors[tone] || colors.info;
}

function clamp(value, min, max) {
    return Math.min(Math.max(Number(value) || min, min), max);
}

function clampToStep(value) {
    const clamped = clamp(value, MIN_BET, MAX_BET);
    return Math.round(clamped / BET_STEP) * BET_STEP;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
