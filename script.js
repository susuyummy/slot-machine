const symbols = [
    '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg',
    '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg',
    'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg',
    'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg',
    'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg',
    'IMG_1538.JPG'
];
const symbolType = [
    'diamond',
    'star',
    'bell',
    'grape',
    'lemon',
    'cherry'
];
let balance = 1000;
let isSpinning = false;
let isAutoMode = false;
let freeSpin = false;

const reelCount = 5;
const rowCount = 3;
const wheelLength = 30;
const reels = Array.from({length: reelCount}, (_, i) => document.getElementById(`reel${i + 1}`));
const spinButton = document.getElementById('spin-button');
const balanceDisplay = document.getElementById('balance');
const betInput = document.getElementById('bet');
const messageDiv = document.getElementById('message');
const autoButton = document.getElementById('auto-button');
const stopAutoButton = document.getElementById('stop-auto');
const winLines = document.querySelectorAll('.win-line');

// 拉霸機圖案與對應圖片
const SYMBOLS = [
    { name: 'cherry', img: 'IMG_1538.JPG', label: '🍒' },
    { name: 'lemon', img: 'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg', label: '🍋' },
    { name: 'grape', img: 'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg', label: '🍇' },
    { name: 'bell', img: 'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg', label: '🔔' },
    { name: 'star', img: '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg', label: '⭐' },
    { name: 'diamond', img: '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg', label: '💎' }
];

const REEL_COUNT = 5;

// 顯示中獎線
function showWinLine(lineIndex) {
    winLines[lineIndex].classList.add('active');
    setTimeout(() => {
        winLines[lineIndex].classList.remove('active');
    }, 2000);
}

// 讀取本地餘額
function loadBalance() {
    const saved = localStorage.getItem('slot-balance');
    if (saved !== null) {
        balance = parseInt(saved);
    }
    balanceDisplay.textContent = balance;
}

// 儲存本地餘額
function saveBalance() {
    localStorage.setItem('slot-balance', balance);
}

window.onload = () => {
    loadBalance();
    reels.forEach(reel => {
        const inner = reel.querySelector('.reel-inner');
        inner.innerHTML = '';
        inner.style.transform = 'translateY(0)';
    });
    // 拉桿互動
    const lever = document.getElementById('lever');
    if (lever) {
        lever.addEventListener('click', async () => {
            if (isSpinning || isAutoMode || balance < 10) return;
            isAutoMode = true;
            autoLeverSpin();
        });
    }
    renderReels(Array(REEL_COUNT).fill(0));
    document.getElementById('spin-button').onclick = spin;
    document.getElementById('bet').value = 10;
    document.getElementById('bet').disabled = false;
};

function updateBalance(amount) {
    balance += amount;
    balanceDisplay.textContent = balance;
    saveBalance();
}

function getRandomSymbols() {
    return Array.from({ length: REEL_COUNT }, () => Math.floor(Math.random() * SYMBOLS.length));
}

function renderReels(symbolIndexes) {
    for (let i = 0; i < REEL_COUNT; i++) {
        const reel = document.getElementById(`reel${i + 1}`);
        const inner = reel.querySelector('.reel-inner');
        inner.innerHTML = `<img src="${SYMBOLS[symbolIndexes[i]].img}" alt="${SYMBOLS[symbolIndexes[i]].label}" title="${SYMBOLS[symbolIndexes[i]].label}" />`;
    }
}

function showMessage(msg, color = '#d32f2f') {
    messageDiv.textContent = msg;
    messageDiv.style.color = color;
}

function clearMessage() {
    messageDiv.textContent = '';
}

function countEachSymbol(symbolIndexes) {
    const count = {};
    for (const idx of symbolIndexes) {
        count[idx] = (count[idx] || 0) + 1;
    }
    return count;
}

function checkWin(symbolIndexes) {
    const count = countEachSymbol(symbolIndexes);
    let result = { win: false, multiplier: 0, message: '', bonus: false, freeSpin: false };
    const diamondIdx = SYMBOLS.findIndex(s => s.name === 'diamond');
    const starIdx = SYMBOLS.findIndex(s => s.name === 'star');
    const bellIdx = SYMBOLS.findIndex(s => s.name === 'bell');
    const diamondCount = count[diamondIdx] || 0;
    const starCount = count[starIdx] || 0;
    const bellCount = count[bellIdx] || 0;
    if (diamondCount === 5) {
        result = { win: true, multiplier: 1000, message: '五個💎！x1000倍！', bonus: false, freeSpin: false };
    } else if (Object.values(count).some((v, idx) => v === 5 && idx !== diamondIdx)) {
        result = { win: true, multiplier: 500, message: '五個相同！x500倍！', bonus: false, freeSpin: false };
    } else if (diamondCount === 4) {
        result = { win: true, multiplier: 100, message: '四個💎！x100倍！', bonus: false, freeSpin: false };
    } else if (Object.values(count).some((v, idx) => v === 4 && idx !== diamondIdx)) {
        result = { win: true, multiplier: 50, message: '四個相同！x50倍！', bonus: false, freeSpin: false };
    } else if (diamondCount === 3) {
        result = { win: true, multiplier: 20, message: '三個💎！x20倍！', bonus: false, freeSpin: false };
    } else if (Object.values(count).some((v, idx) => v === 3 && idx !== diamondIdx)) {
        result = { win: true, multiplier: 5, message: '三個相同！x5倍！', bonus: false, freeSpin: false };
    } else if (diamondCount === 2) {
        result = { win: true, multiplier: 3, message: '兩個💎！x3倍！', bonus: false, freeSpin: false };
    } else if (Object.values(count).some((v, idx) => v === 2 && idx !== diamondIdx)) {
        result = { win: true, multiplier: 1.5, message: '兩個相同！x1.5倍！', bonus: false, freeSpin: false };
    }
    if (starCount === 3) {
        result.bonus = true;
        result.message += ' 觸發BONUS GAME!';
    }
    if (bellCount === 3) {
        result.freeSpin = true;
        result.message += ' 獲得一次免費轉盤!';
    }
    return result;
}

// 新增：顯示獎金動畫圖案
function showBonusIcon() {
    let icon = document.createElement('div');
    icon.id = 'bonus-icon';
    icon.style.position = 'fixed';
    icon.style.left = '50%';
    icon.style.top = '30%';
    icon.style.transform = 'translate(-50%, -50%)';
    icon.style.fontSize = '5rem';
    icon.style.zIndex = '9999';
    icon.style.pointerEvents = 'none';
    icon.style.animation = 'bonus-pop 1.2s cubic-bezier(0.23,1,0.32,1)';
    icon.innerHTML = '⭐BONUS!';
    document.body.appendChild(icon);
    setTimeout(() => {
        icon.remove();
    }, 1200);
}

async function spin() {
    if (isSpinning) return;
    clearMessage();
    
    const currentBet = parseInt(betInput.value);
    if (!freeSpin && balance < currentBet) {
        showMessage('餘額不足！', '#d32f2f');
        return;
    }
    
    isSpinning = true;
    spinButton.disabled = true;
    autoButton.disabled = true;
    betInput.disabled = true; // 轉動時禁用下注更改
    
    if (!freeSpin) updateBalance(-currentBet);
    freeSpin = false;
    
    const board = await spinAllReels53(2500);
    const result = getWinResult53(board, currentBet);
    
    if (result.winLineIndex !== -1) {
        showWinLine(result.winLineIndex);
    }
    
    if (result.winAmount > 0) {
        updateBalance(result.winAmount);
        showMessage(result.msg + ` 您贏得了 ${result.winAmount} 點！`, '#388e3c');
    } else {
        showMessage('很可惜，沒有中獎，再試一次吧！', '#d32f2f');
    }
    
    if (result.bonus) {
        showBonusIcon();
    }
    
    if (result.free) {
        freeSpin = true;
        setTimeout(() => {
            showMessage('免費轉盤啟動！', '#1976D2');
            setTimeout(() => {
                freeSpin = false;
                spin();
            }, 1000);
        }, 1000);
    }
    
    isSpinning = false;
    spinButton.disabled = false;
    autoButton.disabled = false;
    betInput.disabled = false; // 恢復下注更改
}

async function autoLeverSpin() {
    const lever = document.getElementById('lever');
    while (balance > 0) {
        if (lever) {
            lever.classList.add('lever-pushed');
        }
        await spin();
        await sleep(400);
        if (lever) {
            lever.classList.remove('lever-pushed');
        }
        await sleep(200);
    }
    isAutoMode = false;
}

spinButton.addEventListener('click', spin);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 產生五乘三的盤面
function getRandomBoard() {
    return Array.from({length: reelCount}, () =>
        Array.from({length: rowCount}, () => Math.floor(Math.random() * symbols.length))
    );
}

// 動畫滾輪，三格都滾動
async function spinAllReels53(duration = 2500, stopBoard = null) {
    let wheels = [];
    for (let col = 0; col < reelCount; col++) {
        let wheel = [];
        for (let i = 0; i < wheelLength; i++) {
            wheel.push(Math.floor(Math.random() * symbols.length));
        }
        wheels.push(wheel);
    }
    for (let col = 0; col < reelCount; col++) {
        const inner = reels[col].querySelector('.reel-inner');
        inner.innerHTML = '';
        for (let i = 0; i < wheelLength; i++) {
            inner.innerHTML += getSymbolImg(symbols[wheels[col][i]]);
        }
        inner.style.transform = 'translateY(0)';
    }
    let currentOffset = 0;
    let steps = 40;
    let minInterval = 20;
    let maxInterval = 180;
    let finalOffsets = stopBoard ? stopBoard.map(colArr => colArr[0]) : Array.from({length: reelCount}, () => Math.floor(Math.random() * (wheelLength - rowCount)));
    for (let i = 0; i < steps; i++) {
        currentOffset++;
        for (let col = 0; col < reelCount; col++) {
            // 每次都補一個新隨機
            wheels[col][(currentOffset + wheelLength - 1) % wheelLength] = Math.floor(Math.random() * symbols.length);
            const inner = reels[col].querySelector('.reel-inner');
            inner.style.transition = 'transform 0.06s cubic-bezier(0.23, 1, 0.32, 1)';
            inner.style.transform = `translateY(-${currentOffset * 60}px)`;
        }
        let t = i / (steps - 1);
        let interval = minInterval + (maxInterval - minInterval) * Math.pow(t, 2.5);
        await sleep(interval);
        if ((currentOffset + rowCount) >= wheelLength) {
            for (let col = 0; col < reelCount; col++) {
                const inner = reels[col].querySelector('.reel-inner');
                let newImgs = '';
                for (let i = 0; i < wheelLength; i++) {
                    const idx = (currentOffset + i) % wheelLength;
                    newImgs += getSymbolImg(symbols[wheels[col][idx]]);
                }
                inner.innerHTML = newImgs;
                inner.style.transition = 'none';
                inner.style.transform = 'translateY(0)';
            }
            currentOffset = 0;
        }
    }
    // 最後平滑滑到隨機停下的位置
    for (let col = 0; col < reelCount; col++) {
        const inner = reels[col].querySelector('.reel-inner');
        inner.style.transition = 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1)';
        inner.style.transform = `translateY(-${finalOffsets[col] * 60}px)`;
    }
    await sleep(300);
    // 回傳盤面
    let board = [];
    for (let col = 0; col < reelCount; col++) {
        let colArr = [];
        for (let row = 0; row < rowCount; row++) {
            colArr.push(wheels[col][(finalOffsets[col] + row) % wheelLength]);
        }
        board.push(colArr);
    }
    return board;
}

function getSymbolImg(symbol) {
    return `<img src="${symbol}" alt="水果">`;
}

// 只判斷中間橫排
function getWinResult53(board, betAmount) {
    let line = [];
    for (let col = 0; col < reelCount; col++) {
        line.push(board[col][1]);
    }

    const counts = {};
    line.forEach(idx => {
        counts[idx] = (counts[idx] || 0) + 1;
    });

    let maxType = null;
    let maxCount = 0;
    for (const idx in counts) {
        if (counts[idx] > maxCount) {
            maxCount = counts[idx];
            maxType = parseInt(idx);
        }
    }

    const type = symbolType[maxType];
    let result = { winAmount: 0, msg: '', bonus: false, free: false, winLineIndex: 1 };

    if (maxCount === 5 && type === 'diamond') {
        result = { winAmount: betAmount * 1000, msg: '五個💎！x1000倍！', bonus: false, free: false, winLineIndex: 1 };
    } else if (maxCount === 5) {
        result = { winAmount: betAmount * 500, msg: '五個相同！x500倍！', bonus: false, free: false, winLineIndex: 1 };
    } else if (maxCount === 4 && type === 'diamond') {
        result = { winAmount: betAmount * 100, msg: '四個💎！x100倍！', bonus: false, free: false, winLineIndex: 1 };
    } else if (maxCount === 4) {
        result = { winAmount: betAmount * 50, msg: '四個相同！x50倍！', bonus: false, free: false, winLineIndex: 1 };
    } else if (maxCount === 3 && type === 'diamond') {
        result = { winAmount: betAmount * 20, msg: '三個💎！x20倍！', bonus: false, free: false, winLineIndex: 1 };
    } else if (maxCount === 3) {
        result = { winAmount: betAmount * 5, msg: '三個相同！x5倍！', bonus: false, free: false, winLineIndex: 1 };
    }

    let starCount = 0, bellCount = 0;
    line.forEach(idx => {
        if (symbolType[idx] === 'star') starCount++;
        if (symbolType[idx] === 'bell') bellCount++;
    });

    if (starCount === 3) {
        result.bonus = true;
        result.msg += ' 觸發BONUS GAME!';
    }
    if (bellCount === 3) {
        result.free = true;
        result.msg += ' 獲得一次免費轉盤!';
    }

    return result;
}

// 新增動畫樣式
const style = document.createElement('style');
style.innerHTML = `@keyframes bonus-pop {0%{transform:translate(-50%,-50%) scale(0.5);opacity:0;}40%{transform:translate(-50%,-50%) scale(1.2);opacity:1;}70%{transform:translate(-50%,-50%) scale(1);opacity:1;}100%{transform:translate(-50%,-50%) scale(0.7);opacity:0;}}`;
document.head.appendChild(style);

// 自動模式控制
autoButton.addEventListener('click', () => {
    isAutoMode = true;
    autoButton.style.display = 'none';
    stopAutoButton.style.display = 'inline-block';
    if (!isSpinning) {
        autoSpin();
    }
});

stopAutoButton.addEventListener('click', () => {
    isAutoMode = false;
    autoButton.style.display = 'inline-block';
    stopAutoButton.style.display = 'none';
});

async function autoSpin() {
    const currentBet = parseInt(betInput.value);
    while (isAutoMode && balance >= currentBet) {
        await spin();
        await sleep(1000);
    }
    if (balance < currentBet) {
        isAutoMode = false;
        autoButton.style.display = 'inline-block';
        stopAutoButton.style.display = 'none';
    }
}

// 限制下注金額範圍
betInput.addEventListener('change', function() {
    let value = parseInt(this.value);
    if (isNaN(value) || value < 10) {
        value = 10;
    } else if (value > 100) {
        value = 100;
    }
    this.value = value;
}); 