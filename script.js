// ===== 遊戲配置 =====
const CONFIG = {
    REEL_COUNT: 5,
    ROW_COUNT: 3,
    WHEEL_LENGTH: 30,
    MIN_BET: 10,
    MAX_BET: 100,
    INITIAL_BALANCE: 1000,
    SPIN_DURATION: 2500,
    DEBUG_MODE: false
};

// ===== 符號定義 =====
const SYMBOLS = {
    files: [
        '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg',
        'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg',
        'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg',
        'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg',
        'IMG_1538.JPG',
        '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg'
    ],
    types: [
        'diamond',  // 鑽石
        'bell',     // 鈴鐺
        'grape',    // 葡萄
        'lemon',    // 檸檬
        'cherry',   // 櫻桃
        'orange'    // 橘子
    ],
    names: [
        '💎 鑽石',
        '🔔 鈴鐺',
        '🍇 葡萄',
        '🍋 檸檬',
        '🍒 櫻桃',
        '🍊 橘子'
    ]
};

// ===== 中獎線定義 =====
const PAYLINES = [
    [[0,0], [1,0], [2,0], [3,0], [4,0]], // 上排
    [[0,1], [1,1], [2,1], [3,1], [4,1]], // 中排
    [[0,2], [1,2], [2,2], [3,2], [4,2]], // 下排
    [[0,0], [1,1], [2,2], [3,1], [4,0]], // 斜線 ↘↗
    [[0,2], [1,1], [2,0], [3,1], [4,2]]  // 斜線 ↙↖
];

// ===== 獎金表 =====
const PAYTABLE = {
    diamond: { 5: 1000, 4: 100, 3: 20 },
    default: { 5: 500, 4: 50, 3: 5 }
};

// ===== 遊戲狀態 =====
let gameState = {
    balance: CONFIG.INITIAL_BALANCE,
    currentBet: CONFIG.MIN_BET,
    isSpinning: false,
    isAutoMode: false,
    freeSpin: false,
    lastBoard: null
};

// ===== DOM 元素 =====
const elements = {
    // 轉輪
    reels: Array.from({length: CONFIG.REEL_COUNT}, (_, i) => 
        document.getElementById(`reel${i + 1}`)),
    
    // 按鈕
    spinButton: document.getElementById('spin-button'),
    autoButton: document.getElementById('auto-button'),
    stopAutoButton: document.getElementById('stop-auto'),
    lever: document.getElementById('lever'),
    
    // 下注控制
    betInput: document.getElementById('bet'),
    betMinus: document.getElementById('bet-minus'),
    betPlus: document.getElementById('bet-plus'),
    presetButtons: document.querySelectorAll('.preset-btn'),
    
    // 顯示
    balanceDisplay: document.getElementById('balance'),
    messageDiv: document.getElementById('message'),
    
    // 中獎線
    winLines: document.querySelectorAll('.win-line'),
    
    // 特效
    winEffects: document.getElementById('win-effects'),
    
    // Debug
    debugPanel: document.getElementById('debug-panel'),
    debugContent: document.getElementById('debug-content')
};

// ===== 工具函數 =====
class GameUtils {
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static getRandomBoard() {
        return Array.from({length: CONFIG.REEL_COUNT}, () =>
            Array.from({length: CONFIG.ROW_COUNT}, () => 
                Math.floor(Math.random() * SYMBOLS.files.length)));
    }
    
    static saveBalance() {
        localStorage.setItem('slot-balance', gameState.balance);
    }
    
    static loadBalance() {
        const saved = localStorage.getItem('slot-balance');
        if (saved !== null) {
            gameState.balance = parseInt(saved);
        }
        this.updateBalanceDisplay();
    }
    
    static updateBalanceDisplay() {
        elements.balanceDisplay.textContent = gameState.balance;
        elements.balanceDisplay.classList.add('balance-update');
        setTimeout(() => {
            elements.balanceDisplay.classList.remove('balance-update');
        }, 500);
    }
    
    static updateBalance(amount) {
        gameState.balance += amount;
        this.updateBalanceDisplay();
        this.saveBalance();
    }
    
    static showMessage(msg, color = '#e74c3c') {
        elements.messageDiv.textContent = msg;
        elements.messageDiv.style.color = color;
        elements.messageDiv.style.background = `rgba(${color === '#e74c3c' ? '231, 76, 60' : color === '#27ae60' ? '39, 174, 96' : '52, 152, 219'}, 0.1)`;
    }
    
    static clearMessage() {
        elements.messageDiv.textContent = '';
        elements.messageDiv.style.background = 'rgba(255,255,255,0.1)';
    }
    
    static debugLog(message, data = null) {
        if (CONFIG.DEBUG_MODE) {
            console.log(`[DEBUG] ${message}`, data);
            if (elements.debugContent) {
                elements.debugContent.innerHTML += `<div>${message}</div>`;
                if (data) {
                    elements.debugContent.innerHTML += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
                }
            }
        }
    }
    
    static toggleDebug() {
        CONFIG.DEBUG_MODE = !CONFIG.DEBUG_MODE;
        elements.debugPanel.style.display = CONFIG.DEBUG_MODE ? 'block' : 'none';
        if (CONFIG.DEBUG_MODE) {
            elements.debugContent.innerHTML = '<div>Debug Mode Enabled</div>';
        }
    }
}

// ===== 渲染系統 =====
class RenderSystem {
    static renderReels(board) {
        GameUtils.debugLog('Rendering board:', board);
        
        for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
            const reel = elements.reels[col];
            const inner = reel.querySelector('.reel-inner');
            
            // 清除舊內容
            inner.innerHTML = '';
            inner.style.transition = 'none';
            inner.style.transform = 'translateY(0px)';
            
            for (let row = 0; row < CONFIG.ROW_COUNT; row++) {
                const symbolIndex = board[col][row];
                const img = document.createElement('img');
                img.src = SYMBOLS.files[symbolIndex];
                img.alt = SYMBOLS.names[symbolIndex];
                img.style.cssText = 'width:70px;height:70px;object-fit:cover;border:2px solid #fff;border-radius:5px;margin:2px;background:#f8f9fa;display:block;';
                
                img.onerror = () => {
                    // 如果圖片加載失敗，顯示 emoji
                    img.style.display = 'none';
                    const emoji = document.createElement('div');
                    emoji.style.cssText = 'width:70px;height:70px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f8f9fa;border:2px solid #fff;border-radius:5px;margin:2px;';
                    emoji.textContent = SYMBOLS.names[symbolIndex].split(' ')[0];
                    inner.appendChild(emoji);
                };
                
                inner.appendChild(img);
            }
        }
        
        gameState.lastBoard = board;
        GameUtils.debugLog('Board rendered successfully');
    }
    
    static showWinLines(lineIndexes) {
        GameUtils.debugLog('Showing win lines:', lineIndexes);
        
        // 清除所有中獎線
        elements.winLines.forEach(line => line.classList.remove('active'));
        
        // 顯示中獎線，加入閃爍效果
        lineIndexes.forEach((index, i) => {
            if (elements.winLines[index]) {
                setTimeout(() => {
                    elements.winLines[index].classList.add('active');
                    
                    // 高亮對應的符號
                    this.highlightWinningSymbols(index);
                }, i * 300); // 錯開顯示時間
            }
        });
        
        // 4秒後清除
        setTimeout(() => {
            elements.winLines.forEach(line => line.classList.remove('active'));
            this.clearHighlightedSymbols();
        }, 4000);
    }
    
    static highlightWinningSymbols(lineIndex) {
        const payline = PAYLINES[lineIndex];
        payline.forEach(([col, row]) => {
            const reel = elements.reels[col];
            const inner = reel.querySelector('.reel-inner');
            const symbols = inner.querySelectorAll('img');
            if (symbols[row]) {
                symbols[row].classList.add('winning-symbol');
            }
        });
    }
    
    static clearHighlightedSymbols() {
        elements.reels.forEach(reel => {
            const symbols = reel.querySelectorAll('.winning-symbol');
            symbols.forEach(symbol => symbol.classList.remove('winning-symbol'));
        });
    }
    
    static createWinEffect(winAmount) {
        const effectsContainer = elements.winEffects;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 創建金幣動畫
        for (let i = 0; i < Math.min(winAmount / 10, 20); i++) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.className = 'coin-animation';
                coin.textContent = '💰';
                coin.style.left = (centerX + (Math.random() - 0.5) * 200) + 'px';
                coin.style.top = (centerY + (Math.random() - 0.5) * 100) + 'px';
                effectsContainer.appendChild(coin);
                
                setTimeout(() => {
                    coin.remove();
                }, 2000);
            }, i * 100);
        }
    }
}

// ===== 動畫系統 =====
class AnimationSystem {
    static async spinAllReels(duration = CONFIG.SPIN_DURATION) {
        return new Promise((resolve) => {
            try {
                GameUtils.debugLog('Starting reel animation');
                
                // 生成最終結果
                const finalBoard = GameUtils.getRandomBoard();
                
                // 為每個轉輪創建動畫
                const reelAnimations = [];
                
                for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
                    const reel = elements.reels[col];
                    const inner = reel.querySelector('.reel-inner');
                    
                    // 創建足夠的符號用於動畫
                    const symbolCount = 15;
                    inner.innerHTML = '';
                    
                    for (let i = 0; i < symbolCount; i++) {
                        const img = document.createElement('img');
                        img.src = SYMBOLS.files[Math.floor(Math.random() * SYMBOLS.files.length)];
                        img.alt = 'symbol';
                        img.style.cssText = 'width:70px;height:70px;object-fit:cover;border:2px solid #fff;border-radius:5px;margin:2px;background:#f8f9fa;display:block;';
                        inner.appendChild(img);
                    }
                    
                    // 設置初始位置
                    inner.style.transition = 'none';
                    inner.style.transform = 'translateY(0px)';
                    
                    // 開始動畫
                    const animationDuration = duration + (col * 200); // 錯開停止時間
                    const animation = this.animateReel(inner, animationDuration);
                    reelAnimations.push(animation);
                }
                
                // 等待所有動畫完成
                Promise.all(reelAnimations).then(() => {
                    // 清除所有動畫狀態
                    elements.reels.forEach(reel => {
                        const inner = reel.querySelector('.reel-inner');
                        inner.style.transition = 'none';
                        inner.style.transform = 'translateY(0px)';
                    });
                    
                    // 延遲顯示最終結果，確保動畫完全結束
                    setTimeout(() => {
                        RenderSystem.renderReels(finalBoard);
                        GameUtils.debugLog('Animation completed, final board:', finalBoard);
                        resolve(finalBoard);
                    }, 300);
                });
                
            } catch (error) {
                GameUtils.debugLog('Animation error:', error);
                const errorBoard = GameUtils.getRandomBoard();
                RenderSystem.renderReels(errorBoard);
                resolve(errorBoard);
            }
        });
    }
    
    static animateReel(inner) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const duration = 1500 + Math.random() * 1000; // 隨機動畫時間
            const totalDistance = 1050; // 總移動距離
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // 使用緩動函數
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentDistance = totalDistance * easeOut;
                
                inner.style.transform = `translateY(-${currentDistance}px)`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
}

// ===== 獎金計算系統 =====
class PayoutSystem {
    static calculateWin(board, betAmount) {
        GameUtils.debugLog('Calculating win for board:', board);
        
        let result = {
            winAmount: 0,
            message: '',
            free: false,
            winLines: []
        };

        // 檢查每條中獎線
        PAYLINES.forEach((payline, lineIndex) => {
            const lineResult = this.checkPayline(board, payline, betAmount);
            if (lineResult.winAmount > 0) {
                result.winAmount += lineResult.winAmount;
                result.message += (result.message ? ' + ' : '') + lineResult.message;
                result.winLines.push(lineIndex);
            }
        });

        // 檢查特殊符號（只檢查免費轉盤）
        const specialResult = this.checkSpecialSymbols(board);
        result.free = specialResult.free;
        
        if (specialResult.free) {
            result.message += ' 🎁 獲得免費轉盤!';
        }

        GameUtils.debugLog('Win calculation result:', result);
        return result;
    }
    
    static checkPayline(board, payline, betAmount) {
        let line = [];
        
        // 獲取這條線上的符號
        payline.forEach(([col, row]) => {
            line.push(board[col][row]);
        });
        
        // 計算連續相同符號的數量（從左開始）
        let firstSymbol = line[0];
        let firstType = SYMBOLS.types[firstSymbol];
        let count = 1;
        
        for (let i = 1; i < line.length; i++) {
            if (SYMBOLS.types[line[i]] === firstType) {
                count++;
            } else {
                break;
            }
        }
        
        let winAmount = 0;
        let message = '';
        
        if (count >= 3) {
            const multiplier = this.getMultiplier(firstType, count);
            winAmount = betAmount * multiplier;
            message = `${count}個${SYMBOLS.names[firstSymbol]} ×${multiplier}`;
        }
        
        return { winAmount, message };
    }
    
    static getMultiplier(symbolType, count) {
        if (symbolType === 'diamond') {
            return PAYTABLE.diamond[count] || 0;
        } else {
            return PAYTABLE.default[count] || 0;
        }
    }
    
    static checkSpecialSymbols(board) {
        let bellCount = 0;
        
        // 計算特殊符號數量（只計算鈴鐺）
        for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
            for (let row = 0; row < CONFIG.ROW_COUNT; row++) {
                const symbolType = SYMBOLS.types[board[col][row]];
                if (symbolType === 'bell') bellCount++;
            }
        }
        
        return {
            free: bellCount >= 3
        };
    }
}

// ===== 主遊戲系統 =====
class GameSystem {
    static async spin() {
        if (gameState.isSpinning) return;
        
        try {
            GameUtils.clearMessage();
            
            // 檢查餘額
            if (!gameState.freeSpin && gameState.balance < gameState.currentBet) {
                GameUtils.showMessage('💰 餘額不足！', '#e74c3c');
                return;
            }
            
            // 設置遊戲狀態
            gameState.isSpinning = true;
            this.updateButtonStates();
            
            // 扣除下注金額
            if (!gameState.freeSpin) {
                GameUtils.updateBalance(-gameState.currentBet);
            }
            
            const wasFreeSpin = gameState.freeSpin;
            gameState.freeSpin = false;
            
            GameUtils.debugLog('Starting spin with bet:', gameState.currentBet);
            
            // 執行轉動動畫
            const board = await AnimationSystem.spinAllReels();
            
            // 計算獎金
            const result = PayoutSystem.calculateWin(board, gameState.currentBet);
            
            // 處理結果
            await this.handleResult(result, wasFreeSpin);
            
        } catch (error) {
            GameUtils.debugLog('Spin error:', error);
            GameUtils.showMessage('❌ 發生錯誤，請重試', '#e74c3c');
        } finally {
            this.resetGameState();
        }
    }
    
    static async handleResult(result, wasFreeSpin = false) {
        try {
            // 顯示中獎
            if (result.winAmount > 0) {
                RenderSystem.showWinLines(result.winLines);
                GameUtils.updateBalance(result.winAmount);
                GameUtils.showMessage(result.message + ` 🎊 贏得 ${result.winAmount} 點！`, '#27ae60');
                RenderSystem.createWinEffect(result.winAmount);
            } else {
                GameUtils.showMessage('😔 沒有中獎，再試一次吧！', '#e74c3c');
            }
            
            // 處理免費轉盤
            if (result.free) {
                gameState.freeSpin = true;
                GameUtils.showMessage('🎁 免費轉盤啟動！', '#3498db');
                
                await GameUtils.sleep(1500);
                
                // 自動執行免費轉盤
                setTimeout(() => {
                    this.spin();
                }, 500);
                return; // 免費轉盤會自動執行，不需要重置狀態
            }
            
            // 如果是自動模式且不是免費轉盤，繼續自動轉動
            if (gameState.isAutoMode && !wasFreeSpin && !result.free) {
                setTimeout(() => {
                    this.continueAutoMode();
                }, 1000);
            }
        } catch (error) {
            GameUtils.debugLog('HandleResult error:', error);
            GameUtils.showMessage('❌ 處理結果時發生錯誤', '#e74c3c');
        }
    }
    
    static continueAutoMode() {
        if (gameState.isAutoMode && gameState.balance >= gameState.currentBet) {
            this.spin();
        } else if (gameState.balance < gameState.currentBet) {
            this.stopAutoMode();
            GameUtils.showMessage('💰 餘額不足，自動模式已停止', '#e74c3c');
        }
    }
    
    static async startAutoMode() {
        gameState.isAutoMode = true;
        this.updateAutoButtons();
        
        // 開始第一次轉動
        if (!gameState.isSpinning) {
            this.spin();
        }
    }
    
    static stopAutoMode() {
        gameState.isAutoMode = false;
        this.updateAutoButtons();
    }
    
    static updateButtonStates() {
        elements.spinButton.disabled = gameState.isSpinning;
        elements.autoButton.disabled = gameState.isSpinning;
        elements.betInput.disabled = gameState.isSpinning;
    }
    
    static updateAutoButtons() {
        elements.autoButton.style.display = gameState.isAutoMode ? 'none' : 'inline-block';
        elements.stopAutoButton.style.display = gameState.isAutoMode ? 'inline-block' : 'none';
    }
    
    static resetGameState() {
        setTimeout(() => {
            gameState.isSpinning = false;
            this.updateButtonStates();
            
            // 不要重新渲染盤面，保持動畫結果
            GameUtils.debugLog('Game state reset, spinning =', gameState.isSpinning);
        }, 500);
    }
}

// ===== 下注系統 =====
class BettingSystem {
    static setBet(amount) {
        amount = Math.max(CONFIG.MIN_BET, Math.min(CONFIG.MAX_BET, amount));
        gameState.currentBet = amount;
        elements.betInput.value = amount;
        this.updatePresetButtons();
        GameUtils.debugLog('Bet set to:', amount);
    }
    
    static adjustBet(delta) {
        const newBet = gameState.currentBet + delta;
        this.setBet(newBet);
    }
    
    static updatePresetButtons() {
        elements.presetButtons.forEach(btn => {
            const betValue = parseInt(btn.dataset.bet);
            btn.classList.toggle('active', betValue === gameState.currentBet);
        });
    }
    
    static validateBetInput() {
        let value = parseInt(elements.betInput.value);
        if (isNaN(value)) {
            value = CONFIG.MIN_BET;
        }
        this.setBet(value);
    }
}

// ===== 事件處理 =====
class EventHandler {
    static init() {
        // 轉動按鈕
        elements.spinButton.addEventListener('click', () => {
            if (!gameState.isSpinning && (gameState.balance >= gameState.currentBet || gameState.freeSpin)) {
                GameSystem.spin();
            }
        });
        
        // 自動模式按鈕
        elements.autoButton.addEventListener('click', () => {
            GameSystem.startAutoMode();
        });
        
        elements.stopAutoButton.addEventListener('click', () => {
            GameSystem.stopAutoMode();
        });
        
        // 拉桿
        if (elements.lever) {
            elements.lever.addEventListener('click', async () => {
                if (gameState.isSpinning || (gameState.balance < gameState.currentBet && !gameState.freeSpin)) return;
                
                elements.lever.classList.add('lever-pushed');
                await GameSystem.spin();
                
                setTimeout(() => {
                    elements.lever.classList.remove('lever-pushed');
                }, 1000);
            });
        }
        
        // 下注控制
        elements.betMinus.addEventListener('click', () => {
            BettingSystem.adjustBet(-10);
        });
        
        elements.betPlus.addEventListener('click', () => {
            BettingSystem.adjustBet(10);
        });
        
        elements.betInput.addEventListener('input', () => {
            BettingSystem.validateBetInput();
        });
        
        // 預設下注按鈕
        elements.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const betValue = parseInt(btn.dataset.bet);
                BettingSystem.setBet(betValue);
            });
        });
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !gameState.isSpinning) {
                e.preventDefault();
                GameSystem.spin();
            }
            if (e.code === 'KeyD' && e.ctrlKey) {
                e.preventDefault();
                GameUtils.toggleDebug();
            }
        });
    }
}

// ===== 初始化 =====
class GameInitializer {
    static init() {
        GameUtils.debugLog('Initializing game...');
        
        // 載入餘額
        GameUtils.loadBalance();
        
        // 初始化下注
        BettingSystem.setBet(CONFIG.MIN_BET);
        
        // 初始化盤面
        const initialBoard = GameUtils.getRandomBoard();
        RenderSystem.renderReels(initialBoard);
        
        // 初始化事件
        EventHandler.init();
        
        GameUtils.debugLog('Game initialized successfully');
        GameUtils.showMessage('🎰 歡迎來到拉霸機遊戲！按空白鍵或點擊按鈕開始遊戲', '#3498db');
    }
}

// ===== 遊戲啟動 =====
window.addEventListener('DOMContentLoaded', () => {
    GameInitializer.init();
});

// ===== 全局函數（用於調試） =====
window.gameDebug = {
    toggleDebug: () => GameUtils.toggleDebug(),
    getGameState: () => gameState,
    setBalance: (amount) => {
        gameState.balance = amount;
        GameUtils.updateBalanceDisplay();
        GameUtils.saveBalance();
    },
    getBoard: () => gameState.lastBoard
}; 