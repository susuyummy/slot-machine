// ===== 標準拉霸機遊戲 =====
// 完全按照主流拉霸機規則設計

console.log('🎰 標準拉霸機遊戲載入中...');

// ===== 遊戲配置 =====
const GAME_CONFIG = {
    REELS: 5,
    ROWS: 3,
    SYMBOLS: [
        'IMG_1538.JPG',           // 圖片1
        'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg', // 圖片2
        'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg', // 圖片3
        'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg', // 圖片4
        '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg', // 圖片5 (免費轉盤)
        '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg', // 圖片6
        'IMG_1385.JPG'            // 圖片7
    ],
    SYMBOL_NAMES: ['圖片1', '圖片2', '圖片3', '圖片4', '圖片5', '圖片6', '圖片7'],
    SYMBOL_EMOJIS: ['🎨', '🖼️', '🌟', '✨', '💫', '🎯', '🐰'],
    
    // 3D圓柱體配置
    CYLINDER_CONFIG: {
        SYMBOLS_COUNT: 20,        // 每個圓柱體上的符號數量
        RADIUS: 80,               // 圓柱體半徑
        SYMBOL_HEIGHT: 100,       // 每個符號的高度
        PERSPECTIVE: 1000,        // 3D透視距離
    },
    
    // 動畫配置
    ANIMATION_CONFIG: {
        SPIN_DURATION: 3000,      // 轉動持續時間(ms)
        SPIN_ROUNDS: 5,           // 轉動圈數
        ROLLBACK_ANGLE: 15,       // 回滾角度範圍
        STOP_DELAY: 200,          // 每個轉輪停止間隔
    },
    
    // 賠付線定義
    PAYLINES: [
        [0, 3, 6, 9, 12],   // 上排水平線
        [1, 4, 7, 10, 13],  // 中排水平線  
        [2, 5, 8, 11, 14],  // 下排水平線
        [0, 4, 8, 10, 12],  // 對角線1
        [2, 4, 6, 10, 14]   // 對角線2
    ],
    
    // 符號權重 (機率分配)
    SYMBOL_WEIGHTS: [25, 20, 18, 15, 8, 10, 4], // 對應SYMBOLS陣列的權重
    
    // 賠付表
    PAYTABLE: {
        'IMG_1538.JPG': { 3: 100, 4: 300, 5: 1000 },
        'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg': { 3: 150, 4: 450, 5: 1500 },
        'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg': { 3: 200, 4: 600, 5: 2000 },
        'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg': { 3: 250, 4: 750, 5: 2500 },
        '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg': { 3: 0, 4: 0, 5: 0 }, // 免費轉盤符號
        '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg': { 3: 400, 4: 1200, 5: 4000 },
        'IMG_1385.JPG': { 3: 500, 4: 1500, 5: 3000 }
    },
    SPIN_DURATION: 2000,
    MIN_BET: 1,
    MAX_BET: 500,
    INITIAL_BALANCE: 1000
};

// ===== 遊戲狀態管理 =====
class GameState {
    constructor() {
        this.balance = GAME_CONFIG.INITIAL_BALANCE;
        this.currentBet = 10;
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
        for (let reel = 0; reel < GAME_CONFIG.REELS; reel++) {
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                const totalWeight = GAME_CONFIG.SYMBOL_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
                let random = Math.random() * totalWeight;
                
                for (let i = 0; i < GAME_CONFIG.SYMBOLS.length; i++) {
                    random -= GAME_CONFIG.SYMBOL_WEIGHTS[i];
                    if (random <= 0) {
                        board.push(GAME_CONFIG.SYMBOLS[i]);
                        break;
                    }
                }
            }
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
        this.cylinderReels = [];
        this.validateElements();
        this.initCylinderReels();
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
    
    initCylinderReels() {
        // 清空並重新創建圓柱體轉輪
        this.cylinderReels = [];
        
        this.elements.reels.forEach((reelElement, index) => {
            if (!reelElement) return;
            
            // 設置轉輪容器樣式
            reelElement.style.perspective = `${GAME_CONFIG.CYLINDER_CONFIG.PERSPECTIVE}px`;
            reelElement.style.perspectiveOrigin = 'center center';
            reelElement.style.overflow = 'visible';
            
            // 創建圓柱體轉輪實例
            const cylinderReel = new CylinderReel(reelElement, GAME_CONFIG);
            this.cylinderReels.push(cylinderReel);
        });
        
        console.log('✅ 3D圓柱體轉輪初始化完成');
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
                    
                    // 載入成功時的處理
                    img.onload = () => {
                        console.log('✅ 圖片載入成功:', symbolFile);
                    };
                    
                    // 圖片載入失敗時顯示emoji符號
                    img.onerror = () => {
                        console.warn('❌ 圖片載入失敗:', symbolFile);
                        const symbolEmoji = this.getSymbolEmoji(symbolFile);
                        symbolElement.innerHTML = '';
                        symbolElement.textContent = symbolEmoji;
                        symbolElement.style.fontSize = '2.5rem';
                        symbolElement.style.color = '#fff';
                        symbolElement.style.textAlign = 'center';
                        symbolElement.style.display = 'flex';
                        symbolElement.style.alignItems = 'center';
                        symbolElement.style.justifyContent = 'center';
                        symbolElement.style.background = 'linear-gradient(45deg, #666, #999)';
                        symbolElement.style.borderRadius = '5px';
                        console.log('🔄 使用備用符號:', symbolFile, '->', symbolEmoji);
                    };
                    
                    // 設置載入超時（3秒後如果還沒載入就使用備用符號）
                    setTimeout(() => {
                        if (!img.complete) {
                            console.warn('⏰ 圖片載入超時:', symbolFile);
                            img.onerror();
                        }
                    }, 3000);
                    
                    symbolElement.appendChild(img);
                } else {
                    // 顯示emoji符號作為備用
                    const symbolEmoji = this.getSymbolEmoji(symbolFile) || '❓';
                    symbolElement.textContent = symbolEmoji;
                    symbolElement.style.fontSize = '2.5rem';
                    symbolElement.style.color = '#fff';
                    symbolElement.style.textAlign = 'center';
                    symbolElement.style.display = 'flex';
                    symbolElement.style.alignItems = 'center';
                    symbolElement.style.justifyContent = 'center';
                    symbolElement.style.background = 'linear-gradient(45deg, #666, #999)';
                    symbolElement.style.borderRadius = '5px';
                    console.log('📝 使用emoji符號:', symbolFile, '->', symbolEmoji);
                }
                
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
        // 啟動所有圓柱體轉輪的旋轉
        this.cylinderReels.forEach(cylinderReel => {
            if (cylinderReel) {
                cylinderReel.spin();
            }
        });
        
        // 保持原有的CSS類別以便其他邏輯使用
        this.elements.reels.forEach(reel => {
            if (reel) {
                reel.classList.add('spinning');
                reel.classList.remove('stopping');
            }
        });
    }
    
    hideSpinAnimation(finalBoard) {
        // 將最終盤面轉換為每個轉輪的符號陣列
        const reelSymbols = [];
        for (let reel = 0; reel < GAME_CONFIG.REELS; reel++) {
            const symbols = [];
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                const index = reel * GAME_CONFIG.ROWS + row;
                symbols.push(finalBoard[index]);
            }
            reelSymbols.push(symbols);
        }
        
        // 停止每個圓柱體轉輪
        this.cylinderReels.forEach((cylinderReel, index) => {
            if (cylinderReel) {
                setTimeout(() => {
                    cylinderReel.stop(reelSymbols[index]);
                }, index * GAME_CONFIG.ANIMATION_CONFIG.STOP_DELAY);
            }
        });
        
        // 保持原有的CSS類別管理
        this.elements.reels.forEach((reel, index) => {
            if (reel) {
                setTimeout(() => {
                    reel.classList.remove('spinning');
                    reel.classList.add('stopping');
                    
                    setTimeout(() => {
                        reel.classList.remove('stopping');
                    }, GAME_CONFIG.ANIMATION_CONFIG.SPIN_DURATION);
                }, index * GAME_CONFIG.ANIMATION_CONFIG.STOP_DELAY);
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
        // 創建主要勝利效果
        const effect = document.createElement('div');
        effect.className = 'win-effect';
        effect.textContent = `+${amount}`;
        document.body.appendChild(effect);
        
        // 創建多個飄散的金幣效果
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.className = 'coin-effect';
                coin.textContent = '💰';
                coin.style.left = `${50 + (Math.random() - 0.5) * 60}%`;
                coin.style.animationDelay = `${Math.random() * 0.5}s`;
                document.body.appendChild(coin);
                
                setTimeout(() => {
                    if (coin.parentNode) {
                        coin.parentNode.removeChild(coin);
                    }
                }, 2000);
            }, i * 100);
        }
        
        // 創建彩帶效果
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-effect';
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.backgroundColor = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b'][Math.floor(Math.random() * 6)];
                confetti.style.animationDelay = `${Math.random() * 0.3}s`;
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 50);
        }
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 2000);
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
        let freeSpinCount = 0;
        let bonusCount = 0;
        
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
        
        // 計算特殊符號（不限連線）- 免費轉盤觸發
        board.forEach(symbol => {
            if (symbol === '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg') {
                freeSpinCount++;
            }
            // 可以在這裡添加其他特殊符號的邏輯
        });
        
        const finalWin = totalPayout * this.gameState.currentBet;
        
        console.log(`總賠付: ${totalPayout} × ${this.gameState.currentBet} = ${finalWin}`);
        console.log(`免費轉盤符號數量: ${freeSpinCount}`);
        
        // 調整免費轉盤觸發條件：需要4個以上才觸發，給予8次免費轉動
        let freeSpinsAwarded = 0;
        if (freeSpinCount >= 5) {
            freeSpinsAwarded = 15; // 5個符號 = 15次免費轉動
        } else if (freeSpinCount >= 4) {
            freeSpinsAwarded = 8;  // 4個符號 = 8次免費轉動
        }
        
        return {
            totalWin: finalWin,
            winningLines,
            winningPositions: Array.from(winningPositions),
            freeSpins: freeSpinsAwarded,
            bonusGame: bonusCount >= 3,
            message: this.generateWinMessage(finalWin, winningLines.length, freeSpinCount, bonusCount, freeSpinsAwarded)
        };
    }
    
    generateWinMessage(winAmount, lineCount, freeSpinCount, bonusCount, freeSpinsAwarded) {
        let message = '';
        
        if (winAmount > 0) {
            message += `🎊 中獎！贏得 ${winAmount} 點！(${lineCount}條賠付線中獎)`;
        } else {
            message += '再試一次！記住：只有從最左側開始的連續3個以上相同圖片才能中獎';
        }
        
        if (freeSpinsAwarded > 0) {
            if (freeSpinCount >= 5) {
                message += ` 🎉 超級免費轉盤！${freeSpinCount}個圖片5觸發${freeSpinsAwarded}次免費轉動！`;
            } else {
                message += ` 🎁 觸發免費轉盤！${freeSpinCount}個圖片5獲得${freeSpinsAwarded}次免費轉動！`;
            }
        } else if (freeSpinCount === 3) {
            message += ` 💫 差一點！再多1個圖片5就能觸發免費轉盤了！`;
        }
        
        if (bonusCount >= 3) {
            message += ` ⭐ 觸發Bonus Game！`;
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
            this.dom.hideSpinAnimation(newBoard);
            
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
        
        // 下注金額選擇器
        if (this.dom.elements.betAmount) {
            this.dom.elements.betAmount.addEventListener('change', (e) => {
                const newBet = parseInt(e.target.value);
                this.updateBet(newBet);
            });
        }
        
        // 下注增減按鈕
        const betMinus = document.getElementById('bet-minus');
        const betPlus = document.getElementById('bet-plus');
        
        if (betMinus) {
            betMinus.addEventListener('click', () => {
                this.adjustBet(-1);
            });
        }
        
        if (betPlus) {
            betPlus.addEventListener('click', () => {
                this.adjustBet(1);
            });
        }
        
        // 快速下注按鈕
        const quickBetButtons = document.querySelectorAll('.quick-bet-btn[data-bet]');
        quickBetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const betAmount = parseInt(btn.dataset.bet);
                this.updateBet(betAmount);
                this.updateQuickBetButtons(betAmount);
            });
        });
        
        // MAX下注按鈕
        const maxBetBtn = document.getElementById('max-bet');
        if (maxBetBtn) {
            maxBetBtn.addEventListener('click', () => {
                const maxBet = Math.min(gameState.balance, GAME_CONFIG.MAX_BET);
                this.updateBet(maxBet);
                this.updateQuickBetButtons(maxBet);
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
    
    // 更新下注金額
    updateBet(newBet) {
        if (newBet >= GAME_CONFIG.MIN_BET && newBet <= GAME_CONFIG.MAX_BET && newBet <= gameState.balance) {
            gameState.currentBet = newBet;
            this.dom.updateDisplay(gameState);
            this.updateBetSelector(newBet);
            console.log('💰 下注金額更新為:', newBet);
        } else if (newBet > gameState.balance) {
            this.dom.showMessage('💰 下注金額不能超過餘額！', 'lose');
        } else {
            this.dom.showMessage(`💰 下注金額必須在 ${GAME_CONFIG.MIN_BET} - ${GAME_CONFIG.MAX_BET} 之間！`, 'lose');
        }
    }
    
    // 調整下注金額（增減）
    adjustBet(direction) {
        const betOptions = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
        const currentIndex = betOptions.indexOf(gameState.currentBet);
        
        let newIndex;
        if (direction > 0) {
            newIndex = Math.min(currentIndex + 1, betOptions.length - 1);
        } else {
            newIndex = Math.max(currentIndex - 1, 0);
        }
        
        const newBet = betOptions[newIndex];
        this.updateBet(newBet);
        this.updateQuickBetButtons(newBet);
    }
    
    // 更新下注選擇器的值
    updateBetSelector(bet) {
        if (this.dom.elements.betAmount) {
            this.dom.elements.betAmount.value = bet;
        }
    }
    
    // 更新快速下注按鈕的狀態
    updateQuickBetButtons(currentBet) {
        const quickBetButtons = document.querySelectorAll('.quick-bet-btn[data-bet]');
        quickBetButtons.forEach(btn => {
            const betAmount = parseInt(btn.dataset.bet);
            if (betAmount === currentBet) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
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
        domManager.showMessage('🎰 標準拉霸機準備就緒！從最左側開始連續3個以上相同圖片才能中獎！', 'info');
        
        // 全域調試接口
        window.gameDebug = {
            state: () => gameState.getStatus(),
            spin: () => gameLogic.spin(),
            testWin: () => {
                gameState.currentBoard = [
                    'IMG_1385.JPG', 'IMG_1385.JPG', 'IMG_1385.JPG', 'IMG_1538.JPG', 'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg',
                    'IMG_1385.JPG', 'IMG_1385.JPG', 'IMG_1385.JPG', 'IMG_1538.JPG', 'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg',
                    'IMG_1385.JPG', 'IMG_1385.JPG', 'IMG_1385.JPG', 'IMG_1538.JPG', 'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg'
                ];
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

console.log('✅ 標準拉霸機遊戲腳本載入完成'); 