// ===== 全新拉霸機遊戲 =====
// 採用更穩定可靠的架構，確保遊戲永不卡死

console.log('🎰 全新拉霸機遊戲載入中...');

// ===== 遊戲配置 =====
const GAME_CONFIG = {
    REELS: 5,
    ROWS: 3,
    SYMBOLS: [
        'IMG_1538.JPG',
        'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg',
        'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg',
        'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg',
        '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg',
        '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg',
        'IMG_1385.JPG'
    ],
    SYMBOL_NAMES: ['圖片1', '圖片2', '圖片3', '圖片4', '圖片5', '圖片6', '圖片7'],
    SYMBOL_EMOJIS: ['🎨', '🖼️', '🌟', '✨', '💫', '🎯', '🐰'],
    PAYLINES: [
        [0, 1, 2, 3, 4], // 第一排
        [5, 6, 7, 8, 9], // 第二排
        [10, 11, 12, 13, 14], // 第三排
        [0, 6, 12, 8, 4], // 對角線1
        [10, 6, 2, 8, 14] // 對角線2
    ],
    PAYTABLE: {
        'IMG_1385.JPG': { 3: 150, 4: 800, 5: 3000 }, // 圖片7 - 超級獎勵
        '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg': { 3: 100, 4: 500, 5: 2000 }, // 圖片6 - 最高價值
        '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg': { 3: 50, 4: 200, 5: 1000 },  // 圖片5 - 免費轉盤觸發
        'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg': { 3: 30, 4: 100, 5: 500 },   // 圖片3
        'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg': { 3: 20, 4: 80, 5: 300 },    // 圖片4
        'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg': { 3: 15, 4: 60, 5: 200 },    // 圖片2
        'IMG_1538.JPG': { 3: 10, 4: 40, 5: 100 }  // 圖片1
    },
    SPIN_DURATION: 2000,
    MIN_BET: 10,
    MAX_BET: 100,
    INITIAL_BALANCE: 1000
};

// ===== 遊戲狀態 =====
class GameState {
    constructor() {
        this.balance = GAME_CONFIG.INITIAL_BALANCE;
        this.currentBet = GAME_CONFIG.MIN_BET;
        this.isSpinning = false;
        this.isAutoMode = false;
        this.freeSpin = false;
        this.currentBoard = this.generateSafeBoard();
        this.lastWin = 0;
        this.spinCount = 0;
        this.debugMode = false;
        
        // 載入儲存的餘額
        this.loadBalance();
        
        console.log('🎮 遊戲狀態初始化完成:', this.getStatus());
    }
    
    generateSafeBoard() {
        const board = [];
        for (let i = 0; i < GAME_CONFIG.REELS * GAME_CONFIG.ROWS; i++) {
            const randomIndex = Math.floor(Math.random() * GAME_CONFIG.SYMBOLS.length);
            const safeIndex = Math.max(0, Math.min(randomIndex, GAME_CONFIG.SYMBOLS.length - 1));
            board[i] = GAME_CONFIG.SYMBOLS[safeIndex];
        }
        console.log('🛡️  生成安全盤面:', board);
        return board;
    }
    
    getStatus() {
        return {
            balance: this.balance,
            currentBet: this.currentBet,
            isSpinning: this.isSpinning,
            isAutoMode: this.isAutoMode,
            freeSpin: this.freeSpin,
            lastWin: this.lastWin,
            spinCount: this.spinCount,
            boardLength: this.currentBoard.length
        };
    }
    
    saveBalance() {
        try {
            localStorage.setItem('slotBalance', this.balance.toString());
            console.log('💾 餘額已儲存:', this.balance);
        } catch (e) {
            console.warn('⚠️  無法儲存餘額:', e);
        }
    }
    
    loadBalance() {
        try {
            const saved = localStorage.getItem('slotBalance');
            if (saved && !isNaN(parseInt(saved))) {
                this.balance = parseInt(saved);
                console.log('💾 餘額已載入:', this.balance);
            }
        } catch (e) {
            console.warn('⚠️  無法載入餘額:', e);
        }
    }
    
    updateBalance(amount) {
        const oldBalance = this.balance;
        this.balance = Math.max(0, this.balance + amount);
        this.saveBalance();
        console.log(`💰 餘額更新: ${oldBalance} ${amount >= 0 ? '+' : ''}${amount} = ${this.balance}`);
        return this.balance;
    }
    
    canAffordBet() {
        return this.balance >= this.currentBet;
    }
    
    reset() {
        console.log('🔄 重置遊戲狀態...');
        this.isSpinning = false;
        this.isAutoMode = false;
        this.freeSpin = false;
        this.currentBoard = this.generateSafeBoard();
        console.log('✅ 遊戲狀態已重置');
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
            betAmount: document.getElementById('bet-amount'),
            spinBtn: document.getElementById('spin-btn'),
            autoBtn: document.getElementById('auto-btn'),
            stopAutoBtn: document.getElementById('stop-auto-btn'),
            message: document.getElementById('message'),
            reels: Array.from({length: GAME_CONFIG.REELS}, (_, i) => document.getElementById(`reel-${i}`)),
            paylines: document.getElementById('paylines'),
            debugPanel: document.getElementById('debug-panel'),
            debugContent: document.getElementById('debug-content')
        };
    }
    
    validateElements() {
        const missing = [];
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element && key !== 'reels') {
                missing.push(key);
            }
        }
        
        // 檢查轉輪
        this.elements.reels.forEach((reel, index) => {
            if (!reel) missing.push(`reel-${index}`);
        });
        
        if (missing.length > 0) {
            console.error('❌ 缺少DOM元素:', missing);
            throw new Error(`缺少必要的DOM元素: ${missing.join(', ')}`);
        }
        
        console.log('✅ DOM元素驗證通過');
    }
    
    updateDisplay(gameState) {
        try {
            if (this.elements.balance) {
                this.elements.balance.textContent = gameState.balance;
                this.elements.balance.classList.add('update');
                setTimeout(() => this.elements.balance.classList.remove('update'), 500);
            }
            if (this.elements.betDisplay) {
                this.elements.betDisplay.textContent = gameState.currentBet;
            }
            if (this.elements.winDisplay) {
                this.elements.winDisplay.textContent = gameState.lastWin;
                if (gameState.lastWin > 0) {
                    this.elements.winDisplay.classList.add('update');
                    setTimeout(() => this.elements.winDisplay.classList.remove('update'), 1000);
                }
            }
        } catch (e) {
            console.error('❌ 更新顯示失敗:', e);
        }
    }
    
    updateButtons(gameState) {
        try {
            const spinning = gameState.isSpinning;
            
            if (this.elements.spinBtn) {
                this.elements.spinBtn.disabled = spinning || (!gameState.canAffordBet() && !gameState.freeSpin);
                this.elements.spinBtn.innerHTML = spinning ? '<div class="loading"></div> 轉動中...' : '🎰 轉動';
            }
            
            if (this.elements.autoBtn) {
                this.elements.autoBtn.style.display = gameState.isAutoMode ? 'none' : 'inline-block';
            }
            
            if (this.elements.stopAutoBtn) {
                this.elements.stopAutoBtn.style.display = gameState.isAutoMode ? 'inline-block' : 'none';
            }
            
            if (this.elements.betAmount) {
                this.elements.betAmount.disabled = spinning;
            }
        } catch (e) {
            console.error('❌ 更新按鈕失敗:', e);
        }
    }
    
    showMessage(text, type = 'info') {
        try {
            if (this.elements.message) {
                this.elements.message.textContent = text;
                this.elements.message.className = `message ${type}`;
                console.log(`📢 訊息: [${type}] ${text}`);
            }
        } catch (e) {
            console.error('❌ 顯示訊息失敗:', e);
        }
    }
    
    renderBoard(board) {
        console.log('🎨 開始渲染盤面:', board);
        
        try {
            if (!Array.isArray(board) || board.length !== GAME_CONFIG.REELS * GAME_CONFIG.ROWS) {
                console.error('❌ 無效的盤面資料，使用安全盤面');
                board = gameState.generateSafeBoard();
            }
            
            this.elements.reels.forEach((reel, reelIndex) => {
                if (!reel) {
                    console.error(`❌ 轉輪 ${reelIndex} 不存在`);
                    return;
                }
                
                const content = reel.querySelector('.reel-content');
                if (!content) {
                    console.error(`❌ 轉輪 ${reelIndex} 內容容器不存在`);
                    return;
                }
                
                // 清除舊內容
                content.innerHTML = '';
                
                // 渲染3個符號
                for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                    const symbolIndex = reelIndex * GAME_CONFIG.ROWS + row;
                    const symbolFile = board[symbolIndex];
                    
                    const symbolElement = document.createElement('div');
                    symbolElement.className = 'symbol';
                    symbolElement.dataset.index = symbolIndex;
                    
                    // 檢查是否為圖片檔案
                    if (symbolFile && (symbolFile.includes('.jpg') || symbolFile.includes('.jpeg') || symbolFile.includes('.png') || symbolFile.includes('.JPG'))) {
                        const img = document.createElement('img');
                        img.src = symbolFile;
                        img.alt = this.getSymbolName(symbolFile);
                        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 5px;';
                        
                        // 圖片載入失敗時顯示emoji符號
                        img.onerror = () => {
                            const symbolEmoji = this.getSymbolEmoji(symbolFile);
                            symbolElement.innerHTML = '';
                            symbolElement.textContent = symbolEmoji;
                            symbolElement.style.fontSize = '2rem';
                            symbolElement.style.color = '#fff';
                            symbolElement.style.textAlign = 'center';
                            symbolElement.style.display = 'flex';
                            symbolElement.style.alignItems = 'center';
                            symbolElement.style.justifyContent = 'center';
                            symbolElement.style.background = 'linear-gradient(45deg, #666, #999)';
                            symbolElement.style.borderRadius = '5px';
                            console.log('🖼️ 渲染時圖片載入失敗，使用備用符號:', symbolFile, '->', symbolEmoji);
                        };
                        
                        // 圖片載入成功時的處理
                        img.onload = () => {
                            console.log('✅ 圖片載入成功:', symbolFile);
                        };
                        
                        symbolElement.appendChild(img);
                    } else {
                        // 顯示emoji符號作為備用
                        const symbolEmoji = this.getSymbolEmoji(symbolFile) || '❓';
                        symbolElement.textContent = symbolEmoji;
                        symbolElement.style.fontSize = '2rem';
                        symbolElement.style.color = '#fff';
                        symbolElement.style.textAlign = 'center';
                        symbolElement.style.display = 'flex';
                        symbolElement.style.alignItems = 'center';
                        symbolElement.style.justifyContent = 'center';
                        symbolElement.style.background = 'linear-gradient(45deg, #666, #999)';
                        symbolElement.style.borderRadius = '5px';
                    }
                    
                    content.appendChild(symbolElement);
                }
                
                console.log(`✅ 轉輪 ${reelIndex} 渲染完成`);
            });
            
            console.log('✅ 盤面渲染完成');
            
        } catch (e) {
            console.error('❌ 渲染盤面失敗:', e);
            this.showMessage('❌ 盤面渲染失敗，請重試', 'lose');
        }
    }
    
    showSpinAnimation() {
        this.elements.reels.forEach(reel => {
            if (reel) {
                reel.classList.remove('stopping');
                reel.classList.add('spinning');
            }
        });
    }
    
    hideSpinAnimation() {
        this.elements.reels.forEach((reel, index) => {
            if (reel) {
                // 錯開停止時間，讓轉輪依序停止
                setTimeout(() => {
                    reel.classList.remove('spinning');
                    reel.classList.add('stopping');
                    
                    // 停止動畫完成後移除stopping類
                    setTimeout(() => {
                        reel.classList.remove('stopping');
                        // 確保最終位置穩定
                        const content = reel.querySelector('.reel-content');
                        if (content) {
                            content.style.transform = 'translateY(0)';
                        }
                    }, 800); // 0.3s + 0.4s 動畫時間 + 緩衝
                }, index * 200); // 每個轉輪間隔200ms
            }
        });
    }
    
    highlightWinningSymbols(winningPositions) {
        try {
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
            
            console.log('✨ 中獎符號高亮完成:', winningPositions);
        } catch (e) {
            console.error('❌ 高亮中獎符號失敗:', e);
        }
    }
    
    createWinEffect(winAmount) {
        try {
            const effect = document.createElement('div');
            effect.className = 'win-effect';
            effect.textContent = `+${winAmount}`;
            document.body.appendChild(effect);
            
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 2000);
            
            // 金幣雨效果
            if (winAmount > 500) {
                this.createCoinRain();
            }
        } catch (e) {
            console.error('❌ 創建中獎特效失敗:', e);
        }
    }
    
    createCoinRain() {
        try {
            const rainContainer = document.createElement('div');
            rainContainer.className = 'coin-rain';
            document.body.appendChild(rainContainer);
            
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const coin = document.createElement('div');
                    coin.className = 'coin';
                    coin.textContent = '💰';
                    coin.style.left = Math.random() * 100 + '%';
                    coin.style.animationDelay = Math.random() * 2 + 's';
                    rainContainer.appendChild(coin);
                }, i * 100);
            }
            
            setTimeout(() => {
                if (rainContainer.parentNode) {
                    rainContainer.parentNode.removeChild(rainContainer);
                }
            }, 5000);
        } catch (e) {
            console.error('❌ 創建金幣雨失敗:', e);
        }
    }
    
    debugLog(message, data = null) {
        if (gameState.debugMode && this.elements.debugContent) {
            const time = new Date().toLocaleTimeString();
            const logEntry = `[${time}] ${message}`;
            this.elements.debugContent.innerHTML += `<div>${logEntry}</div>`;
            if (data) {
                this.elements.debugContent.innerHTML += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            }
            this.elements.debugContent.scrollTop = this.elements.debugContent.scrollHeight;
        }
    }
    
    getSymbolName(symbolFile) {
        const index = GAME_CONFIG.SYMBOLS.indexOf(symbolFile);
        return index >= 0 ? GAME_CONFIG.SYMBOL_NAMES[index] : '未知符號';
    }
    
    getSymbolEmoji(symbolFile) {
        const index = GAME_CONFIG.SYMBOLS.indexOf(symbolFile);
        return index >= 0 ? GAME_CONFIG.SYMBOL_EMOJIS[index] : '❓';
    }
}

// ===== 遊戲邏輯 =====
class GameLogic {
    constructor(gameState, domManager) {
        this.gameState = gameState;
        this.dom = domManager;
    }
    
    calculateWin(board) {
        console.log('💰 開始計算獎金...');
        console.log('盤面:', board);
        
        let totalWin = 0;
        let winningLines = [];
        let winningPositions = new Set();
        let hasFreeSpin = false;
        
        try {
            // 檢查每條中獎線
            GAME_CONFIG.PAYLINES.forEach((line, lineIndex) => {
                const symbols = line.map(pos => board[pos]);
                console.log(`檢查中獎線 ${lineIndex + 1}:`, symbols);
                
                const win = this.checkLineWin(symbols);
                if (win.amount > 0) {
                    totalWin += win.amount;
                    winningLines.push(lineIndex);
                    line.forEach(pos => winningPositions.add(pos));
                    console.log(`✅ 中獎線 ${lineIndex + 1}: ${win.symbol} x${win.count} = ${win.amount}`);
                }
            });
            
            // 檢查免費轉盤（3個或以上鈴鐺）
            const bellCount = board.filter(symbol => symbol === '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg').length;
            hasFreeSpin = bellCount >= 3;
            
            if (hasFreeSpin) {
                console.log('🎁 觸發免費轉盤！鈴鐺數量:', bellCount);
            }
            
            const result = {
                totalWin: totalWin * this.gameState.currentBet,
                winningLines,
                winningPositions: Array.from(winningPositions),
                hasFreeSpin,
                message: this.generateWinMessage(totalWin, hasFreeSpin, { winningLines })
            };
            
            console.log('💰 獎金計算結果:', result);
            return result;
            
        } catch (e) {
            console.error('❌ 計算獎金失敗:', e);
            return {
                totalWin: 0,
                winningLines: [],
                winningPositions: [],
                hasFreeSpin: false,
                message: '計算錯誤'
            };
        }
    }
    
    checkLineWin(symbols) {
        if (!Array.isArray(symbols) || symbols.length !== 5) {
            return { amount: 0, symbol: '', count: 0 };
        }
        
        const firstSymbol = symbols[0];
        let consecutiveCount = 1;
        
        // 計算從左邊開始的連續相同符號
        for (let i = 1; i < symbols.length; i++) {
            if (symbols[i] === firstSymbol) {
                consecutiveCount++;
            } else {
                break;
            }
        }
        
        // 檢查是否達到最少中獎數量
        if (consecutiveCount >= 3) {
            const paytable = GAME_CONFIG.PAYTABLE[firstSymbol];
            if (paytable && paytable[consecutiveCount]) {
                return {
                    amount: paytable[consecutiveCount],
                    symbol: firstSymbol,
                    count: consecutiveCount
                };
            }
        }
        
        return { amount: 0, symbol: '', count: 0 };
    }
    
    generateWinMessage(totalWin, hasFreeSpin, winDetails = null) {
        let message = '';
        
        if (totalWin > 0) {
            const finalWin = totalWin * this.gameState.currentBet;
            message += `🎊 恭喜中獎！贏得 ${finalWin} 點！`;
            
            if (winDetails && winDetails.winningLines.length > 0) {
                message += ` (${winDetails.winningLines.length}條中獎線)`;
            }
        } else {
            message += '😔 沒有中獎，再試試吧！提示：需要3個以上相同圖片在同一條線上才能中獎';
        }
        
        if (hasFreeSpin) {
            message += ' 🎁 觸發免費轉盤！3個以上相同圖片觸發';
        }
        
        return message;
    }
    
    async spin() {
        console.log('🎰 開始轉動...');
        console.log('轉動前狀態:', this.gameState.getStatus());
        
        // 防重複轉動
        if (this.gameState.isSpinning) {
            console.warn('⚠️  已在轉動中，忽略請求');
            return false;
        }
        
        // 檢查餘額
        if (!this.gameState.freeSpin && !this.gameState.canAffordBet()) {
            this.dom.showMessage('💰 餘額不足！', 'lose');
            console.log('❌ 餘額不足');
            return false;
        }
        
        let spinSuccessful = false;
        
        try {
            // 設置轉動狀態
            this.gameState.isSpinning = true;
            this.gameState.spinCount++;
            
            // 更新UI
            this.dom.updateButtons(this.gameState);
            this.dom.showSpinAnimation();
            this.dom.showMessage('🎰 轉動中...', 'info');
            
            // 扣除下注金額
            if (!this.gameState.freeSpin) {
                this.gameState.updateBalance(-this.gameState.currentBet);
                this.dom.updateDisplay(this.gameState);
            }
            
            const wasFreeSpin = this.gameState.freeSpin;
            this.gameState.freeSpin = false;
            
            // 等待轉動動畫
            await this.sleep(GAME_CONFIG.SPIN_DURATION);
            
            // 生成結果並開始停止動畫
            const newBoard = this.gameState.generateSafeBoard();
            this.gameState.currentBoard = newBoard;
            
            // 開始停止動畫
            this.dom.hideSpinAnimation();
            
            // 等待所有轉輪停止動畫完成
            await this.sleep(1200); // 等待所有轉輪停止
            
            // 顯示最終結果
            this.dom.renderBoard(newBoard);
            
            // 計算獎金
            const winResult = this.calculateWin(newBoard);
            this.gameState.lastWin = winResult.totalWin;
            
            // 處理獎金
            if (winResult.totalWin > 0) {
                this.gameState.updateBalance(winResult.totalWin);
                this.dom.highlightWinningSymbols(winResult.winningPositions);
                this.dom.showMessage(winResult.message, 'win');
                this.dom.createWinEffect(winResult.totalWin);
            } else {
                this.dom.showMessage(winResult.message, 'lose');
            }
            
            // 處理免費轉盤
            if (winResult.hasFreeSpin) {
                this.gameState.freeSpin = true;
                setTimeout(() => {
                    if (!this.gameState.isSpinning) {
                        this.spin();
                    }
                }, 2000);
            }
            
            // 更新顯示
            this.dom.updateDisplay(this.gameState);
            
            spinSuccessful = true;
            console.log('✅ 轉動完成');
            console.log('轉動後狀態:', this.gameState.getStatus());
            
            return true;
            
        } catch (e) {
            console.error('❌ 轉動過程發生錯誤:', e);
            this.dom.showMessage('❌ 轉動失敗，請重試', 'lose');
            
            // 錯誤恢復：退還金額
            if (!wasFreeSpin && !spinSuccessful) {
                this.gameState.updateBalance(this.gameState.currentBet);
                this.dom.updateDisplay(this.gameState);
                console.log('💰 已退還下注金額');
            }
            
            return false;
            
        } finally {
            // 確保狀態重置
            this.gameState.isSpinning = false;
            this.dom.updateButtons(this.gameState);
            this.dom.hideSpinAnimation();
            console.log('🔄 轉動狀態已重置');
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    startAutoMode() {
        console.log('🔄 開始自動模式');
        this.gameState.isAutoMode = true;
        this.dom.updateButtons(this.gameState);
        this.autoSpin();
    }
    
    stopAutoMode() {
        console.log('⏹️  停止自動模式');
        this.gameState.isAutoMode = false;
        this.dom.updateButtons(this.gameState);
    }
    
        async autoSpin() {
        if (!this.gameState.isAutoMode) return;
        
        if ((this.gameState.canAffordBet() || this.gameState.freeSpin) && !this.gameState.isSpinning) {
            try {
                await this.spin();
                
                // 繼續自動轉動
                if (this.gameState.isAutoMode) {
                    setTimeout(() => this.autoSpin(), 1500);
                }
            } catch (e) {
                console.error('❌ 自動轉動失敗:', e);
                if (this.gameState.isAutoMode) {
                    setTimeout(() => this.autoSpin(), 2000);
                }
            }
        } else if (!this.gameState.canAffordBet() && !this.gameState.freeSpin) {
            this.stopAutoMode();
            this.dom.showMessage('💰 餘額不足，自動模式已停止', 'lose');
        } else if (this.gameState.isAutoMode) {
            // 如果正在轉動中，等待後再檢查
            setTimeout(() => this.autoSpin(), 1000);
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
        try {
            // 轉動按鈕
            if (this.dom.elements.spinBtn) {
                this.dom.elements.spinBtn.addEventListener('click', () => {
                    this.gameLogic.spin();
                });
            }
            
            // 自動模式按鈕
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
            
            // 下注金額選擇
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
                
                if (e.code === 'KeyD' && e.ctrlKey) {
                    e.preventDefault();
                    this.toggleDebug();
                }
            });
            
            console.log('✅ 事件監聽器初始化完成');
            
        } catch (e) {
            console.error('❌ 初始化事件失敗:', e);
        }
    }
    
    toggleDebug() {
        gameState.debugMode = !gameState.debugMode;
        if (this.dom.elements.debugPanel) {
            this.dom.elements.debugPanel.classList.toggle('show', gameState.debugMode);
        }
        console.log('🔧 Debug模式:', gameState.debugMode ? '開啟' : '關閉');
    }
}

// ===== 錯誤處理和監控 =====
class ErrorHandler {
    constructor() {
        this.initErrorHandling();
        this.startHealthCheck();
    }
    
    initErrorHandling() {
        // 全局錯誤處理
        window.addEventListener('error', (e) => {
            console.error('🚨 全局錯誤:', e.error);
            this.handleCriticalError(e.error);
        });
        
        // Promise錯誤處理
        window.addEventListener('unhandledrejection', (e) => {
            console.error('🚨 Promise錯誤:', e.reason);
            e.preventDefault();
            this.handleCriticalError(e.reason);
        });
        
        console.log('🛡️  錯誤處理器初始化完成');
    }
    
    handleCriticalError(error) {
        console.log('🔧 處理關鍵錯誤...');
        
        try {
            // 重置遊戲狀態
            if (gameState) {
                gameState.reset();
            }
            
            // 重新渲染安全盤面
            if (domManager) {
                domManager.renderBoard(gameState.currentBoard);
                domManager.updateDisplay(gameState);
                domManager.updateButtons(gameState);
                domManager.showMessage('🔧 系統已自動修復', 'info');
            }
            
            console.log('✅ 錯誤處理完成');
            
        } catch (recoveryError) {
            console.error('❌ 錯誤恢復失敗:', recoveryError);
            
            // 最後手段：重新載入
            if (confirm('遊戲發生嚴重錯誤，是否重新載入頁面？')) {
                window.location.reload();
            }
        }
    }
    
    startHealthCheck() {
        setInterval(() => {
            try {
                // 檢查遊戲狀態
                if (gameState && gameState.isSpinning) {
                    const now = Date.now();
                    if (!gameState.lastSpinTime) {
                        gameState.lastSpinTime = now;
                    } else if (now - gameState.lastSpinTime > 10000) {
                        console.warn('⚠️  轉動超時，執行修復');
                        this.handleCriticalError(new Error('轉動超時'));
                    }
                } else if (gameState) {
                    gameState.lastSpinTime = null;
                }
                
                // 檢查DOM完整性
                if (domManager && domManager.elements.reels) {
                    const missingReels = domManager.elements.reels.filter(reel => !reel).length;
                    if (missingReels > 0) {
                        console.warn('⚠️  發現缺失的轉輪:', missingReels);
                    }
                }
                
            } catch (e) {
                console.error('❌ 健康檢查失敗:', e);
            }
        }, 5000);
        
        console.log('🔍 健康檢查啟動');
    }
}

// ===== 遊戲初始化 =====
let gameState, domManager, gameLogic, eventManager, errorHandler;

function initGame() {
    console.log('🚀 開始初始化遊戲...');
    
    try {
        // 初始化各個模組
        gameState = new GameState();
        domManager = new DOMManager();
        gameLogic = new GameLogic(gameState, domManager);
        eventManager = new EventManager(gameLogic, domManager);
        errorHandler = new ErrorHandler();
        
        // 初始化顯示
        domManager.renderBoard(gameState.currentBoard);
        domManager.updateDisplay(gameState);
        domManager.updateButtons(gameState);
        domManager.showMessage('🎰 遊戲準備就緒！5條中獎線：3排橫線+2條對角線，3個以上相同圖片連線即可中獎！', 'info');
        
        console.log('✅ 遊戲初始化完成！');
        console.log('🎮 遊戲狀態:', gameState.getStatus());
        
        // 提供全局調試接口
        window.gameDebug = {
            state: () => gameState.getStatus(),
            spin: () => gameLogic.spin(),
            reset: () => {
                gameState.reset();
                domManager.renderBoard(gameState.currentBoard);
                domManager.updateDisplay(gameState);
                domManager.updateButtons(gameState);
                domManager.showMessage('🔄 遊戲已重置', 'info');
            },
            addBalance: (amount) => {
                gameState.updateBalance(amount);
                domManager.updateDisplay(gameState);
            },
            toggleDebug: () => eventManager.toggleDebug(),
            forceWin: () => {
                gameState.currentBoard = ['💎', '💎', '💎', '💎', '💎', '💎', '💎', '💎', '💎', '💎', '💎', '💎', '💎', '💎', '💎'];
                domManager.renderBoard(gameState.currentBoard);
            },
            emergencyRecover: () => {
                errorHandler.handleCriticalError(new Error('手動修復'));
            }
        };
        
    } catch (e) {
        console.error('❌ 遊戲初始化失敗:', e);
        alert('遊戲初始化失敗，請重新載入頁面');
    }
}

// ===== 圖片錯誤處理 =====
function handleImageError(img) {
    const symbolFile = img.src.split('/').pop(); // 獲取檔案名
    const index = GAME_CONFIG.SYMBOLS.indexOf(symbolFile);
    const symbolEmoji = index >= 0 ? GAME_CONFIG.SYMBOL_EMOJIS[index] : '❓';
    
    img.style.display = 'none';
    img.parentElement.innerHTML = symbolEmoji;
    img.parentElement.style.fontSize = '2rem';
    img.parentElement.style.color = '#fff';
    img.parentElement.style.display = 'flex';
    img.parentElement.style.alignItems = 'center';
    img.parentElement.style.justifyContent = 'center';
    img.parentElement.style.textAlign = 'center';
    img.parentElement.style.background = 'linear-gradient(45deg, #666, #999)';
    img.parentElement.style.borderRadius = '5px';
    
    console.log('🖼️ 圖片載入失敗，使用備用符號:', symbolFile, '->', symbolEmoji);
}

// ===== 啟動遊戲 =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 為所有圖片添加錯誤處理
        document.querySelectorAll('.symbol img').forEach(img => {
            img.onerror = () => handleImageError(img);
        });
        initGame();
    });
} else {
    // 為所有圖片添加錯誤處理
    document.querySelectorAll('.symbol img').forEach(img => {
        img.onerror = () => handleImageError(img);
    });
    initGame();
}

console.log('🎰 拉霸機遊戲腳本載入完成'); 