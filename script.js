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
const winLine = document.querySelector('.win-line.middle');

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

// 定義中獎線
const PAYLINES = [
    // 橫線
    [[0,0], [1,0], [2,0], [3,0], [4,0]], // 上排
    [[0,1], [1,1], [2,1], [3,1], [4,1]], // 中排
    [[0,2], [1,2], [2,2], [3,2], [4,2]], // 下排
    // 斜線
    [[0,0], [1,1], [2,2], [3,1], [4,0]], // ↘↗
    [[0,2], [1,1], [2,0], [3,1], [4,2]]  // ↙↖
];

// 顯示中獎線
function showWinLine(lineIndexes) {
    const winLines = document.querySelectorAll('.win-line');
    lineIndexes.forEach(index => {
        if (winLines[index]) {
            winLines[index].classList.add('active');
            setTimeout(() => {
                winLines[index].classList.remove('active');
            }, 2000);
        }
    });
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

// BONUS GAME 相關變數
let bonusSpinsLeft = 0;
let bonusTotalWin = 0;
let isBonusGame = false;

// BONUS GAME 元素
const bonusModal = document.getElementById('bonus-modal');
const bonusSpinsDisplay = document.getElementById('bonus-spins');
const bonusWinDisplay = document.getElementById('bonus-win');
const bonusTotalDisplay = document.getElementById('bonus-total');
const bonusSpinButton = document.getElementById('bonus-spin');

// 更新餘額顯示
function updateBalance(amount) {
    balance += amount;
    balanceDisplay.textContent = balance;
    balanceDisplay.classList.add('balance-update');
    setTimeout(() => {
        balanceDisplay.classList.remove('balance-update');
    }, 500);
    saveBalance();
}

// 開始 BONUS GAME
function startBonusGame() {
    isBonusGame = true;
    bonusSpinsLeft = 3;
    bonusTotalWin = 0;
    bonusModal.style.display = 'block';
    updateBonusDisplay();
}

// 更新 BONUS 顯示
function updateBonusDisplay() {
    bonusSpinsDisplay.textContent = bonusSpinsLeft;
    bonusWinDisplay.textContent = '0';
    bonusTotalDisplay.textContent = bonusTotalWin;
}

// BONUS SPIN
async function bonusSpin() {
    if (bonusSpinsLeft <= 0) {
        endBonusGame();
        return;
    }

    bonusSpinButton.disabled = true;
    bonusSpinsLeft--;
    updateBonusDisplay();

    const board = await spinAllReels53(2500);
    const result = getWinResult53(board, parseInt(betInput.value));

    if (result.winAmount > 0) {
        showWinLine(result.winLines);
        bonusTotalWin += result.winAmount;
        bonusWinDisplay.textContent = result.winAmount;
        bonusTotalDisplay.textContent = bonusTotalWin;
        updateBalance(result.winAmount);
    }

    if (bonusSpinsLeft > 0) {
        bonusSpinButton.disabled = false;
    } else {
        setTimeout(endBonusGame, 2000);
    }
}

// 結束 BONUS GAME
function endBonusGame() {
    isBonusGame = false;
    bonusModal.style.display = 'none';
    showMessage(`BONUS GAME 結束！總共贏得 ${bonusTotalWin} 點！`, '#388e3c');
}

// 修改主要的 spin 函數
async function spin() {
    if (isSpinning) return;
    
    try {
        clearMessage();
        const currentBet = parseInt(betInput.value);
        
        if (!freeSpin && balance < currentBet) {
            showMessage('餘額不足！', '#d32f2f');
            return;
        }
        
        isSpinning = true;
        spinButton.disabled = true;
        autoButton.disabled = true;
        betInput.disabled = true;
        
        if (!freeSpin) updateBalance(-currentBet);
        freeSpin = false;
        
        // 添加轉動動畫
        reels.forEach((reel, index) => {
            const inner = reel.querySelector('.reel-inner');
            inner.classList.add('spinning');
            setTimeout(() => {
                inner.classList.remove('spinning');
                inner.classList.add('stopping');
                setTimeout(() => {
                    inner.classList.remove('stopping');
                }, 500);
            }, 1000 + index * 200);
        });

        console.log('開始旋轉...');
        const board = await spinAllReels53(2500);
        console.log('旋轉結束，盤面：', board);
        
        const result = getWinResult53(board, currentBet);
        console.log('計算結果：', result);
        
        if (result.winAmount > 0) {
            showWinLine(result.winLines);
            updateBalance(result.winAmount);
            showMessage(result.msg + ` 您贏得了 ${result.winAmount} 點！`, '#388e3c');
            console.log('顯示獲勝：', result.msg, result.winAmount);
        } else {
            showMessage('很可惜，沒有中獎，再試一次吧！', '#d32f2f');
            console.log('沒有中獎');
        }
        
        if (result.bonus && !isBonusGame) {
            showBonusIcon();
            console.log('觸發 BONUS GAME');
            setTimeout(startBonusGame, 1000);
        }
        
        if (result.free) {
            freeSpin = true;
            console.log('觸發免費轉盤');
            setTimeout(() => {
                showMessage('免費轉盤啟動！', '#1976D2');
                setTimeout(() => {
                    freeSpin = false;
                    spin();
                }, 1000);
            }, 1000);
        }
    } catch (error) {
        console.error('發生錯誤：', error);
        showMessage('發生錯誤，請重新整理頁面後再試', '#d32f2f');
    } finally {
        setTimeout(() => {
            isSpinning = false;
            spinButton.disabled = false;
            autoButton.disabled = false;
            betInput.disabled = false;
            
            reels.forEach(reel => {
                const inner = reel.querySelector('.reel-inner');
                inner.style.transition = 'none';
                inner.style.transform = 'translateY(0)';
            });
        }, 300);
    }
}

async function autoSpin() {
    try {
        const currentBet = parseInt(betInput.value);
        while (isAutoMode && balance >= currentBet) {
            await spin();
            await sleep(1000);
        }
    } catch (error) {
        console.error('Auto spin error:', error);
    } finally {
        isAutoMode = false;
        autoButton.style.display = 'inline-block';
        stopAutoButton.style.display = 'none';
    }
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
async function spinAllReels53(duration = 2500) {
    return new Promise(async (resolve) => {
        try {
            let wheels = [];
            for (let col = 0; col < reelCount; col++) {
                let wheel = [];
                for (let i = 0; i < wheelLength; i++) {
                    wheel.push(Math.floor(Math.random() * symbols.length));
                }
                wheels.push(wheel);
            }

            // 初始化輪盤
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

            // 生成最終結果
            let finalBoard = Array.from({length: reelCount}, () => 
                Array.from({length: rowCount}, () => Math.floor(Math.random() * symbols.length))
            );

            // 主要動畫循環
            for (let i = 0; i < steps; i++) {
                currentOffset++;
                for (let col = 0; col < reelCount; col++) {
                    // 添加延遲停止效果
                    if (i >= steps - 5 - col) continue;
                    
                    wheels[col][(currentOffset + wheelLength - 1) % wheelLength] = Math.floor(Math.random() * symbols.length);
                    const inner = reels[col].querySelector('.reel-inner');
                    inner.style.transition = `transform ${i < steps - 5 ? 0.06 : 0.1}s cubic-bezier(0.23, 1, 0.32, 1)`;
                    inner.style.transform = `translateY(-${currentOffset * 60}px)`;
                }

                let t = i / (steps - 1);
                let interval = minInterval + (maxInterval - minInterval) * Math.pow(t, 2.5);
                await new Promise(r => setTimeout(r, interval));

                if ((currentOffset + rowCount) >= wheelLength) {
                    for (let col = 0; col < reelCount; col++) {
                        if (i >= steps - 5 - col) continue;
                        
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

            // 最終停止位置
            for (let col = 0; col < reelCount; col++) {
                const inner = reels[col].querySelector('.reel-inner');
                inner.innerHTML = '';
                for (let row = 0; row < rowCount; row++) {
                    inner.innerHTML += getSymbolImg(symbols[finalBoard[col][row]]);
                }
                inner.style.transform = 'translateY(0)';
            }

            setTimeout(() => {
                resolve(finalBoard);
            }, 300);
        } catch (error) {
            console.error('動畫錯誤：', error);
            resolve(Array.from({length: reelCount}, () => 
                Array.from({length: rowCount}, () => Math.floor(Math.random() * symbols.length))
            ));
        }
    });
}

function getSymbolImg(symbol) {
    return `<img src="${symbol}" alt="水果">`;
}

// 修改 getWinResult53 函數以支持多條中獎線
function getWinResult53(board, betAmount) {
    try {
        let result = { winAmount: 0, msg: '', bonus: false, free: false, winLines: [] };
        
        // 檢查每條中獎線
        PAYLINES.forEach((payline, lineIndex) => {
            let line = [];
            let positions = [];
            
            // 獲取這條線上的符號
            payline.forEach(([col, row]) => {
                line.push(board[col][row]);
                positions.push([col, row]);
            });
            
            // 計算連續相同符號的數量（從左開始）
            let currentSymbol = line[0];
            let count = 1;
            let maxCount = 1;
            
            for (let i = 1; i < line.length; i++) {
                if (line[i] === currentSymbol) {
                    count++;
                    maxCount = Math.max(maxCount, count);
                } else {
                    break; // 中斷連線就停止
                }
            }
            
            // 如果有至少3個連續符號
            if (maxCount >= 3) {
                const type = symbolType[currentSymbol];
                let lineWin = 0;
                let lineMsg = '';
                
                // 計算獎金
                if (type === 'diamond') {
                    if (maxCount === 5) {
                        lineWin = betAmount * 1000;
                        lineMsg = '五個💎！x1000倍！';
                    } else if (maxCount === 4) {
                        lineWin = betAmount * 100;
                        lineMsg = '四個💎！x100倍！';
                    } else if (maxCount === 3) {
                        lineWin = betAmount * 20;
                        lineMsg = '三個💎！x20倍！';
                    }
                } else {
                    if (maxCount === 5) {
                        lineWin = betAmount * 500;
                        lineMsg = '五個相同！x500倍！';
                    } else if (maxCount === 4) {
                        lineWin = betAmount * 50;
                        lineMsg = '四個相同！x50倍！';
                    } else if (maxCount === 3) {
                        lineWin = betAmount * 5;
                        lineMsg = '三個相同！x5倍！';
                    }
                }
                
                if (lineWin > 0) {
                    result.winAmount += lineWin;
                    result.msg += (result.msg ? ' + ' : '') + lineMsg;
                    result.winLines.push(lineIndex);
                }
                
                // 檢查特殊符號（只需要檢查連續的3個）
                if (maxCount >= 3) {
                    if (type === 'star') {
                        result.bonus = true;
                        result.msg += ' 觸發BONUS GAME!';
                    } else if (type === 'bell') {
                        result.free = true;
                        result.msg += ' 獲得一次免費轉盤!';
                    }
                }
            }
        });
        
        console.log('計算結果：', result);
        return result;
    } catch (error) {
        console.error('計算獎金錯誤：', error);
        return { winAmount: 0, msg: '', bonus: false, free: false, winLines: [] };
    }
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

// 綁定 BONUS GAME 按鈕事件
bonusSpinButton.addEventListener('click', bonusSpin);

// 修改初始化函數
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
            if (isSpinning || (balance < parseInt(betInput.value) && !freeSpin)) return;
            
            lever.classList.add('lever-pushed');
            await spin();
            
            setTimeout(() => {
                lever.classList.remove('lever-pushed');
            }, 1000);
        });
    }
    
    // 初始化輪盤
    renderReels(Array(REEL_COUNT).fill(0));
    
    // 設置按鈕事件
    spinButton.onclick = async () => {
        if (!isSpinning && (balance >= parseInt(betInput.value) || freeSpin)) {
            await spin();
        }
    };
    
    // 設置下注輸入
    betInput.value = 10;
    betInput.min = 10;
    betInput.max = 100;
    betInput.disabled = false;
    
    // 添加輸入驗證
    betInput.addEventListener('input', function() {
        let value = parseInt(this.value);
        if (isNaN(value)) {
            this.value = 10;
        } else {
            value = Math.max(10, Math.min(100, value));
            this.value = value;
        }
    });
}; 