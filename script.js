// ===== 標準拉霸機遊戲 =====
// 完全按照主流拉霸機規則設計

console.log('🎰 標準拉霸機遊戲載入中...');

// ===== 遊戲配置 =====
const GAME_CONFIG = {
    REELS: 5,
    ROWS: 3,
    SYMBOLS: ['🍒', '🍋', '🍇', '🔔', '⭐', '💎'],
    SYMBOL_NAMES: ['櫻桃', '檸檬', '葡萄', '鈴鐺', '星星', '鑽石'],
    PAYLINES: [
        [0, 1, 2, 3, 4],     // 第一排（上排）
        [5, 6, 7, 8, 9],     // 第二排（中排）
        [10, 11, 12, 13, 14], // 第三排（下排）
        [0, 6, 12, 8, 4],    // 對角線1（上左到下右）
        [10, 6, 2, 8, 14]    // 對角線2（下左到上右）
    ],
    PAYTABLE: {
        '💎': { 3: 20, 4: 100, 5: 1000 },  // 鑽石 - 最高價值
        '⭐': { 3: 5, 4: 50, 5: 500 },      // 星星
        '🔔': { 3: 5, 4: 50, 5: 500 },      // 鈴鐺
        '🍇': { 3: 5, 4: 50, 5: 500 },      // 葡萄
        '🍋': { 3: 5, 4: 50, 5: 500 },      // 檸檬
        '🍒': { 3: 5, 4: 50, 5: 500 }       // 櫻桃
    },
    SPIN_DURATION: 2000,
    MIN_BET: 10,
    MAX_BET: 100,
    INITIAL_BALANCE: 1000
};

// ===== 遊戲狀態管理 =====
class GameState {
    constructor() {
        this.balance = GAME_CONFIG.INITIAL_BALANCE;
        this.currentBet = GAME_CONFIG.MIN_BET;
        this.isSpinning = false;
        this.isAutoMode = false;
        this.freeSpins = 0;
        this.bonusGame = false;
        this.currentBoard = this.generateRandomBoard();
        this.lastWin = 0;
        this.totalWins = 0;
        this.spinCount = 0;
        
        this.loadBalance();
        console.log('🎮 遊戲狀態初始化:', this.getStatus());
    }
    
    generateRandomBoard() {
        const board = [];
        for (let i = 0; i < GAME_CONFIG.REELS * GAME_CONFIG.ROWS; i++) {
            const randomSymbol = GAME_CONFIG.SYMBOLS[Math.floor(Math.random() * GAME_CONFIG.SYMBOLS.length)];
            board.push(randomSymbol);
        }
        return board;
    }
    
    getStatus() {
        return {
            balance: this.balance,
            currentBet: this.currentBet,
            isSpinning: this.isSpinning,
            freeSpins: this.freeSpins,
            bonusGame: this.bonusGame,
            lastWin: this.lastWin,
            totalWins: this.totalWins,
            spinCount: this.spinCount
        };
    }
    
    saveBalance() {
        try {
            localStorage.setItem('slotBalance', this.balance.toString());
        } catch (e) {
            console.warn('無法儲存餘額:', e);
        }
    }
    
    loadBalance() {
        try {
            const saved = localStorage.getItem('slotBalance');
            if (saved && !isNaN(parseInt(saved))) {
                this.balance = parseInt(saved);
            }
        } catch (e) {
            console.warn('無法載入餘額:', e);
        }
    }
    
    updateBalance(amount) {
        this.balance = Math.max(0, this.balance + amount);
        this.saveBalance();
        console.log(`💰 餘額更新: ${amount >= 0 ? '+' : ''}${amount} = ${this.balance}`);
        return this.balance;
    }
    
    canAffordBet() {
        return this.balance >= this.currentBet || this.freeSpins > 0;
    }
}

// ===== DOM管理器 =====
class DOMManager {
    constructor() {
        this.elements = this.initElements();
        this.validateElements();
    }
    
    initElements() {
        return {
            balance: document.getElementById('balance'),
            betDisplay: document.getElementById('bet-display'),
            winDisplay: document.getElementById('win-display'),
            freeSpinsDisplay: document.getElementById('free-spins'),
            betAmount: document.getElementById('bet-amount'),
            spinBtn: document.getElementById('spin-btn'),
            autoBtn: document.getElementById('auto-btn'),
            stopAutoBtn: document.getElementById('stop-auto-btn'),
            message: document.getElementById('message'),
            reels: Array.from({length: GAME_CONFIG.REELS}, (_, i) => document.getElementById(`reel-${i}`)),
            paylines: document.getElementById('paylines')
        };
    }
    
    validateElements() {
        const missing = [];
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element && key !== 'reels') {
                missing.push(key);
            }
        }
        
        this.elements.reels.forEach((reel, index) => {
            if (!reel) missing.push(`reel-${index}`);
        });
        
        if (missing.length > 0) {
            console.error('❌ 缺少DOM元素:', missing);
        } else {
            console.log('✅ DOM元素驗證通過');
        }
    }
    
    updateDisplay(gameState) {
        if (this.elements.balance) {
            this.elements.balance.textContent = gameState.balance;
        }
        if (this.elements.betDisplay) {
            this.elements.betDisplay.textContent = gameState.currentBet;
        }
        if (this.elements.winDisplay) {
            this.elements.winDisplay.textContent = gameState.lastWin;
        }
        if (this.elements.freeSpinsDisplay) {
            this.elements.freeSpinsDisplay.textContent = gameState.freeSpins;
            const container = document.getElementById('free-spins-container');
            if (container) {
                container.style.display = gameState.freeSpins > 0 ? 'block' : 'none';
            }
        }
    }
    
    updateButtons(gameState) {
        const spinning = gameState.isSpinning;
        const canSpin = gameState.canAffordBet() && !spinning;
        
        if (this.elements.spinBtn) {
            this.elements.spinBtn.disabled = !canSpin;
            this.elements.spinBtn.innerHTML = spinning ? 
                '<div class="loading"></div> 轉動中...' : 
                (gameState.freeSpins > 0 ? '🎁 免費轉動' : '🎰 轉動');
        }
        
        if (this.elements.autoBtn) {
            this.elements.autoBtn.style.display = gameState.isAutoMode ? 'none' : 'inline-block';
        }
        
        if (this.elements.stopAutoBtn) {
            this.elements.stopAutoBtn.style.display = gameState.isAutoMode ? 'inline-block' : 'none';
        }
        
        if (this.elements.betAmount) {
            this.elements.betAmount.disabled = spinning || gameState.freeSpins > 0;
        }
    }
    
    renderBoard(board) {
        console.log('🎨 渲染盤面:', board);
        
        this.elements.reels.forEach((reel, reelIndex) => {
            if (!reel) return;
            
            const content = reel.querySelector('.reel-content');
            if (!content) return;
            
            content.innerHTML = '';
            
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                const symbolIndex = reelIndex * GAME_CONFIG.ROWS + row;
                const symbol = board[symbolIndex];
                
                const symbolElement = document.createElement('div');
                symbolElement.className = 'symbol';
                symbolElement.dataset.index = symbolIndex;
                symbolElement.textContent = symbol;
                
                content.appendChild(symbolElement);
            }
        });
        
        console.log('✅ 盤面渲染完成');
    }
    
    showMessage(text, type = 'info') {
        if (this.elements.message) {
            this.elements.message.textContent = text;
            this.elements.message.className = `message ${type}`;
        }
    }
    
    showSpinAnimation() {
        this.elements.reels.forEach(reel => {
            if (reel) {
                reel.classList.add('spinning');
                reel.classList.remove('stopping');
            }
        });
    }
    
    hideSpinAnimation() {
        this.elements.reels.forEach((reel, index) => {
            if (reel) {
                setTimeout(() => {
                    reel.classList.remove('spinning');
                    reel.classList.add('stopping');
                    
                    setTimeout(() => {
                        reel.classList.remove('stopping');
                    }, 500);
                }, index * 200);
            }
        });
    }
    
    highlightWinningSymbols(winningPositions) {
        // 清除舊的高亮
        this.elements.reels.forEach(reel => {
            const symbols = reel.querySelectorAll('.symbol');
            symbols.forEach(symbol => symbol.classList.remove('winning'));
        });
        
        // 高亮中獎符號
        winningPositions.forEach(position => {
            const reelIndex = Math.floor(position / GAME_CONFIG.ROWS);
            const reel = this.elements.reels[reelIndex];
            if (reel) {
                const symbols = reel.querySelectorAll('.symbol');
                const symbolIndex = position % GAME_CONFIG.ROWS;
                if (symbols[symbolIndex]) {
                    symbols[symbolIndex].classList.add('winning');
                }
            }
        });
    }
    
    showWinEffect(amount) {
        const effect = document.createElement('div');
        effect.className = 'win-effect';
        effect.textContent = `+${amount}`;
        document.body.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 2000);
    }
}

// ===== 遊戲邏輯核心 =====
class GameLogic {
    constructor(gameState, domManager) {
        this.gameState = gameState;
        this.dom = domManager;
    }
    
    // 核心：檢查賠付線中獎（只有最左連線才算）
    checkPayline(symbols) {
        if (!Array.isArray(symbols) || symbols.length !== 5) {
            return { symbol: null, count: 0, payout: 0 };
        }
        
        const firstSymbol = symbols[0];
        let consecutiveCount = 1;
        
        // 從最左側開始計算連續相同符號
        for (let i = 1; i < symbols.length; i++) {
            if (symbols[i] === firstSymbol) {
                consecutiveCount++;
            } else {
                break; // 一旦不同就停止，這是關鍵！
            }
        }
        
        // 檢查是否達到最低中獎要求（3個以上）
        if (consecutiveCount >= 3) {
            const paytable = GAME_CONFIG.PAYTABLE[firstSymbol];
            if (paytable && paytable[consecutiveCount]) {
                return {
                    symbol: firstSymbol,
                    count: consecutiveCount,
                    payout: paytable[consecutiveCount]
                };
            }
        }
        
        return { symbol: null, count: 0, payout: 0 };
    }
    
    calculateWin(board) {
        console.log('💰 計算中獎結果...');
        console.log('盤面:', board);
        
        let totalPayout = 0;
        let winningLines = [];
        let winningPositions = new Set();
        let bellCount = 0;
        let starCount = 0;
        
        // 檢查每條賠付線
        GAME_CONFIG.PAYLINES.forEach((line, lineIndex) => {
            const symbols = line.map(pos => board[pos]);
            const result = this.checkPayline(symbols);
            
            console.log(`賠付線 ${lineIndex + 1}:`, symbols, `-> ${result.symbol || '無'} ×${result.count} = ${result.payout}`);
            
            if (result.payout > 0) {
                totalPayout += result.payout;
                winningLines.push(lineIndex);
                
                // 只高亮實際中獎的符號位置（從左邊開始的連續符號）
                for (let i = 0; i < result.count; i++) {
                    winningPositions.add(line[i]);
                }
            }
        });
        
        // 計算特殊符號（不限連線）
        board.forEach(symbol => {
            if (symbol === '🔔') bellCount++;
            if (symbol === '⭐') starCount++;
        });
        
        const finalWin = totalPayout * this.gameState.currentBet;
        
        console.log(`總賠付: ${totalPayout} × ${this.gameState.currentBet} = ${finalWin}`);
        
        return {
            totalWin: finalWin,
            winningLines,
            winningPositions: Array.from(winningPositions),
            freeSpins: bellCount >= 3 ? 10 : 0,
            bonusGame: starCount >= 3,
            message: this.generateWinMessage(finalWin, winningLines.length, bellCount, starCount)
        };
    }
    
    generateWinMessage(winAmount, lineCount, bellCount, starCount) {
        let message = '';
        
        if (winAmount > 0) {
            message += `🎊 中獎！贏得 ${winAmount} 點！(${lineCount}條賠付線中獎)`;
        } else {
            message += '再試一次！記住：只有從最左側開始的連續3個以上相同符號才能中獎';
        }
        
        if (bellCount >= 3) {
            message += ` 🔔 觸發免費轉盤！(${bellCount}個鈴鐺)`;
        }
        
        if (starCount >= 3) {
            message += ` ⭐ 觸發Bonus Game！(${starCount}個星星)`;
        }
        
        return message;
    }
    
    async spin() {
        if (this.gameState.isSpinning) {
            console.log('⚠️ 已在轉動中，忽略請求');
            return false;
        }
        
        console.log('🎰 開始轉動...');
        console.log('轉動前狀態:', this.gameState.getStatus());
        
        // 檢查是否能下注
        if (this.gameState.freeSpins === 0 && !this.gameState.canAffordBet()) {
            this.dom.showMessage('💰 餘額不足！', 'lose');
            console.log('❌ 餘額不足');
            return false;
        }
        
        // 設置轉動狀態
        this.gameState.isSpinning = true;
        this.gameState.spinCount++;
        
        // 先扣除下注或免費次數
        if (this.gameState.freeSpins > 0) {
            this.gameState.freeSpins--;
            console.log('🎁 使用免費轉動，剩餘:', this.gameState.freeSpins);
        } else {
            this.gameState.updateBalance(-this.gameState.currentBet);
            console.log('💰 扣除下注金額:', this.gameState.currentBet);
        }
        
        // 更新UI
        this.dom.updateDisplay(this.gameState);
        this.dom.updateButtons(this.gameState);
        this.dom.showSpinAnimation();
        this.dom.showMessage('🎰 轉動中...', 'info');
        
        try {
            // 等待轉動動畫
            await this.sleep(GAME_CONFIG.SPIN_DURATION);
            
            // 生成新盤面
            const newBoard = this.gameState.generateRandomBoard();
            this.gameState.currentBoard = newBoard;
            
            // 停止動畫
            this.dom.hideSpinAnimation();
            
            // 等待停止動畫完成
            await this.sleep(1200);
            
            // 顯示最終結果
            this.dom.renderBoard(newBoard);
            
            // 計算中獎
            const winResult = this.calculateWin(newBoard);
            this.gameState.lastWin = winResult.totalWin;
            
            // 處理獎金
            if (winResult.totalWin > 0) {
                this.gameState.updateBalance(winResult.totalWin);
                this.gameState.totalWins += winResult.totalWin;
                this.dom.highlightWinningSymbols(winResult.winningPositions);
                this.dom.showWinEffect(winResult.totalWin);
                this.dom.showMessage(winResult.message, 'win');
            } else {
                this.dom.showMessage(winResult.message, 'lose');
            }
            
            // 處理特殊功能
            if (winResult.freeSpins > 0) {
                this.gameState.freeSpins += winResult.freeSpins;
                console.log('🎁 獲得免費轉動:', winResult.freeSpins);
            }
            
            if (winResult.bonusGame) {
                this.gameState.bonusGame = true;
                console.log('⭐ 觸發Bonus Game');
            }
            
            // 更新顯示
            this.dom.updateDisplay(this.gameState);
            
            console.log('✅ 轉動完成');
            console.log('轉動後狀態:', this.gameState.getStatus());
            
            return true;
            
        } catch (error) {
            console.error('❌ 轉動過程發生錯誤:', error);
            this.dom.showMessage('❌ 轉動失敗，請重試', 'lose');
            return false;
        } finally {
            // 確保狀態重置
            this.gameState.isSpinning = false;
            this.dom.updateButtons(this.gameState);
            
            // 自動繼續免費轉盤
            if (this.gameState.freeSpins > 0 && this.gameState.isAutoMode) {
                setTimeout(() => this.spin(), 1500);
            }
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    startAutoMode() {
        this.gameState.isAutoMode = true;
        this.dom.updateButtons(this.gameState);
        this.autoSpin();
    }
    
    stopAutoMode() {
        this.gameState.isAutoMode = false;
        this.dom.updateButtons(this.gameState);
    }
    
    async autoSpin() {
        if (!this.gameState.isAutoMode) return;
        
        if (this.gameState.canAffordBet() && !this.gameState.isSpinning) {
            await this.spin();
            
            if (this.gameState.isAutoMode) {
                setTimeout(() => this.autoSpin(), 1500);
            }
        } else if (!this.gameState.canAffordBet()) {
            this.stopAutoMode();
            this.dom.showMessage('💰 餘額不足，自動模式已停止', 'lose');
        }
    }
}

// ===== 事件管理器 =====
class EventManager {
    constructor(gameLogic, domManager) {
        this.gameLogic = gameLogic;
        this.dom = domManager;
        this.initEvents();
    }
    
    initEvents() {
        // 轉動按鈕
        if (this.dom.elements.spinBtn) {
            this.dom.elements.spinBtn.addEventListener('click', () => {
                this.gameLogic.spin();
            });
        }
        
        // 自動模式
        if (this.dom.elements.autoBtn) {
            this.dom.elements.autoBtn.addEventListener('click', () => {
                this.gameLogic.startAutoMode();
            });
        }
        
        if (this.dom.elements.stopAutoBtn) {
            this.dom.elements.stopAutoBtn.addEventListener('click', () => {
                this.gameLogic.stopAutoMode();
            });
        }
        
        // 下注金額
        if (this.dom.elements.betAmount) {
            this.dom.elements.betAmount.addEventListener('change', (e) => {
                const newBet = parseInt(e.target.value);
                if (newBet >= GAME_CONFIG.MIN_BET && newBet <= GAME_CONFIG.MAX_BET) {
                    gameState.currentBet = newBet;
                    this.dom.updateDisplay(gameState);
                    console.log('💰 下注金額更新為:', newBet);
                }
            });
        }
        
        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !gameState.isSpinning) {
                e.preventDefault();
                this.gameLogic.spin();
            }
        });
        
        console.log('✅ 事件監聽器初始化完成');
    }
}

// ===== 全域變數 =====
let gameState, domManager, gameLogic, eventManager;

// ===== 遊戲初始化 =====
function initGame() {
    console.log('🚀 初始化標準拉霸機遊戲...');
    
    try {
        gameState = new GameState();
        domManager = new DOMManager();
        gameLogic = new GameLogic(gameState, domManager);
        eventManager = new EventManager(gameLogic, domManager);
        
        // 初始化顯示
        domManager.renderBoard(gameState.currentBoard);
        domManager.updateDisplay(gameState);
        domManager.updateButtons(gameState);
        domManager.showMessage('🎰 標準拉霸機準備就緒！從最左側開始連續3個以上相同符號才能中獎！', 'info');
        
        // 全域調試接口
        window.gameDebug = {
            state: () => gameState.getStatus(),
            spin: () => gameLogic.spin(),
            testWin: () => {
                gameState.currentBoard = ['💎', '💎', '💎', '🍒', '🍋', '💎', '💎', '💎', '🍒', '🍋', '💎', '💎', '💎', '🍒', '🍋'];
                domManager.renderBoard(gameState.currentBoard);
                const result = gameLogic.calculateWin(gameState.currentBoard);
                console.log('測試中獎結果:', result);
            },
            addBalance: (amount) => {
                gameState.updateBalance(amount);
                domManager.updateDisplay(gameState);
            }
        };
        
        console.log('✅ 遊戲初始化完成！');
        
    } catch (e) {
        console.error('❌ 遊戲初始化失敗:', e);
        alert('遊戲初始化失敗，請重新載入頁面');
    }
}

// ===== 啟動遊戲 =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

console.log('�� 標準拉霸機遊戲腳本載入完成'); 