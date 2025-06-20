// ===== 前端拉霸機遊戲 =====
// 與後端API通信的客戶端版本

console.log('🎰 前端拉霸機遊戲載入中...');

// ===== 全局變數 =====
let gameState = null;
let domManager = null;
let eventManager = null;
let userId = null;
let gameConfig = null;

// ===== 純前端遊戲邏輯 =====
class LocalGameEngine {
    constructor() {
        this.symbols = [
            'IMG_1538.JPG',
            'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg',
            'IMG_1385.JPG',
            'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg',
            '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg',
            '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg',
            'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg'
        ];
        
        this.payouts = {
            'IMG_1385.JPG': { 3: 500, 4: 1500, 5: 3000 },
            '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg': { 3: 400, 4: 1200, 5: 4000 },
            'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg': { 3: 250, 4: 750, 5: 2500 },
            'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg': { 3: 200, 4: 600, 5: 2000 },
            'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg': { 3: 150, 4: 450, 5: 1500 },
            'IMG_1538.JPG': { 3: 100, 4: 300, 5: 1000 }
        };
        
        this.paylines = [
            [0, 1, 2, 3, 4], // 第一排
            [5, 6, 7, 8, 9], // 第二排
            [10, 11, 12, 13, 14], // 第三排
            [0, 6, 12, 8, 4], // 對角線1
            [10, 6, 2, 8, 14] // 對角線2
        ];
    }
    
    generateBoard() {
        const board = [];
        for (let i = 0; i < 15; i++) {
            board.push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
        }
        return board;
    }
    
    calculateWinnings(board, betAmount) {
        let totalWin = 0;
        const winningPositions = new Set();
        const winDetails = [];
        
        for (let lineIndex = 0; lineIndex < this.paylines.length; lineIndex++) {
            const line = this.paylines[lineIndex];
            const symbols = line.map(pos => board[pos]);
            
            // 檢查從左開始的連續相同符號
            let count = 1;
            const firstSymbol = symbols[0];
            
            for (let i = 1; i < symbols.length; i++) {
                if (symbols[i] === firstSymbol) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 3 && this.payouts[firstSymbol]) {
                const multiplier = this.payouts[firstSymbol][count] || 0;
                const lineWin = multiplier * betAmount;
                totalWin += lineWin;
                
                // 記錄中獎位置
                for (let i = 0; i < count; i++) {
                    winningPositions.add(line[i]);
                }
                
                winDetails.push({
                    line: lineIndex + 1,
                    symbol: firstSymbol,
                    count: count,
                    multiplier: multiplier,
                    win: lineWin
                });
            }
        }
        
        return {
            totalWin,
            winningPositions: Array.from(winningPositions),
            winDetails
        };
    }
    
    async spin(betAmount) {
        // 模擬網路延遲
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const board = this.generateBoard();
        const winResult = this.calculateWinnings(board, betAmount);
        
        return {
            success: true,
            result: {
                board,
                totalWin: winResult.totalWin,
                winningPositions: winResult.winningPositions,
                winDetails: winResult.winDetails
            }
        };
    }
}

// ===== API客戶端（支援本地和遠程模式）=====
class APIClient {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.localEngine = new LocalGameEngine();
        this.useLocalMode = false;
        this.checkServerAvailability();
    }
    
    async checkServerAvailability() {
        try {
            const response = await fetch(`${this.baseURL}/api/config`, {
                method: 'GET',
                timeout: 2000
            });
            if (response.ok) {
                console.log('✅ 後端服務器可用，使用服務器模式');
                this.useLocalMode = false;
            } else {
                throw new Error('Server not available');
            }
        } catch (error) {
            console.log('⚠️ 後端服務器不可用，切換到本地模式');
            this.useLocalMode = true;
        }
    }
    
    async request(endpoint, options = {}) {
        if (this.useLocalMode) {
            // 本地模式，返回模擬數據
            return this.handleLocalRequest(endpoint, options);
        }
        
        try {
            const url = `${this.baseURL}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API請求失敗，切換到本地模式:', error);
            this.useLocalMode = true;
            return this.handleLocalRequest(endpoint, options);
        }
    }
    
    async handleLocalRequest(endpoint, options = {}) {
        // 模擬API響應
        if (endpoint.includes('/api/config')) {
            return {
                success: true,
                config: {
                    MIN_BET: 1,
                    MAX_BET: 500,
                    INITIAL_BALANCE: 1000
                }
            };
        }
        
        if (endpoint.includes('/api/session/')) {
            return {
                success: true,
                session: {
                    balance: 1000,
                    lastWin: 0,
                    totalWins: 0,
                    spinCount: 0
                }
            };
        }
        
        if (endpoint.includes('/api/spin')) {
            const body = JSON.parse(options.body || '{}');
            const spinResult = await this.localEngine.spin(body.betAmount || 10);
            return {
                success: true,
                result: spinResult.result,
                session: {
                    balance: 1000 - body.betAmount + spinResult.result.totalWin,
                    lastWin: spinResult.result.totalWin,
                    totalWins: spinResult.result.totalWin,
                    spinCount: 1
                }
            };
        }
        
        return { success: false, error: 'Unknown endpoint' };
    }
    
    async getSession(userId) {
        return this.request(`/api/session/${userId}`);
    }
    
    async spin(userId, betAmount) {
        return this.request('/api/spin', {
            method: 'POST',
            body: JSON.stringify({ userId, betAmount })
        });
    }
    
    async getConfig() {
        return this.request('/api/config');
    }
    
    async resetSession(userId) {
        return this.request(`/api/reset/${userId}`, {
            method: 'POST'
        });
    }
}

// ===== 遊戲狀態管理 =====
class GameState {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.balance = 1000;
        this.currentBet = 10;
        this.lastWin = 0;
        this.totalWins = 0;
        this.spinCount = 0;
        this.isSpinning = false;
        this.isAutoMode = false;
        this.currentBoard = [];
        this.isLocalMode = false; // 追蹤是否為本地模式
    }
    
    async loadSession(userId) {
        try {
            const response = await this.apiClient.getSession(userId);
            if (response.success) {
                const session = response.session;
                this.balance = session.balance;
                this.lastWin = session.lastWin;
                this.totalWins = session.totalWins;
                this.spinCount = session.spinCount;
                console.log('✅ 會話載入成功:', session);
            }
        } catch (error) {
            console.error('❌ 會話載入失敗:', error);
        }
    }
    
    async spin() {
        if (this.isSpinning) {
            console.log('⚠️ 已在轉動中，忽略請求');
            return false;
        }
        
        if (!this.canAffordBet()) {
            console.log('❌ 餘額不足');
            return false;
        }
        
        this.isSpinning = true;
        
        try {
            // 檢查是否為本地模式
            this.isLocalMode = this.apiClient.useLocalMode;
            
            const response = await this.apiClient.spin(userId, this.currentBet);
            
            if (response.success) {
                if (this.isLocalMode) {
                    // 本地模式：手動管理餘額
                    this.balance -= this.currentBet;
                    this.lastWin = response.result.totalWin;
                    this.balance += this.lastWin;
                    this.totalWins += this.lastWin;
                    this.spinCount += 1;
                } else {
                    // 服務器模式：使用服務器返回的會話數據
                    const session = response.session;
                    this.balance = session.balance;
                    this.lastWin = session.lastWin;
                    this.totalWins = session.totalWins;
                    this.spinCount = session.spinCount;
                }
                
                this.currentBoard = response.result.board;
                
                console.log('✅ 轉動成功:', response.result);
                console.log(`💰 餘額: ${this.balance}, 本次獲勝: ${this.lastWin}`);
                return response.result;
            } else {
                console.error('❌ 轉動失敗:', response.error);
                return false;
            }
        } catch (error) {
            console.error('❌ 轉動請求失敗:', error);
            return false;
        } finally {
            this.isSpinning = false;
        }
    }
    
    canAffordBet() {
        return this.balance >= this.currentBet;
    }
    
    updateBet(newBet) {
        if (newBet >= gameConfig.MIN_BET && newBet <= gameConfig.MAX_BET) {
            this.currentBet = newBet;
            return true;
        }
        return false;
    }
    
    getStatus() {
        return {
            balance: this.balance,
            currentBet: this.currentBet,
            lastWin: this.lastWin,
            totalWins: this.totalWins,
            spinCount: this.spinCount,
            isSpinning: this.isSpinning,
            isAutoMode: this.isAutoMode
        };
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
            reels: Array.from({length: 5}, (_, i) => document.getElementById(`reel-${i}`)),
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
    }
    
    updateButtons(gameState) {
        const spinning = gameState.isSpinning;
        const canSpin = gameState.canAffordBet() && !spinning;
        
        if (this.elements.spinBtn) {
            this.elements.spinBtn.disabled = !canSpin;
            this.elements.spinBtn.innerHTML = spinning ? 
                '<div class="loading"></div> 轉動中...' : '🎰 轉動';
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
    }
    
    renderBoard(board) {
        console.log('🎨 渲染盤面:', board);
        
        this.elements.reels.forEach((reel, reelIndex) => {
            if (!reel) return;
            
            const content = reel.querySelector('.reel-content');
            if (!content) return;
            
            content.innerHTML = '';
            
            for (let row = 0; row < 3; row++) {
                const symbolIndex = reelIndex * 3 + row;
                const symbolFile = board[symbolIndex];
                
                const symbolElement = document.createElement('div');
                symbolElement.className = 'symbol';
                symbolElement.dataset.index = symbolIndex;
                
                if (symbolFile && (symbolFile.includes('.jpg') || symbolFile.includes('.jpeg') || symbolFile.includes('.png') || symbolFile.includes('.JPG'))) {
                    const img = document.createElement('img');
                    img.src = symbolFile;
                    img.alt = this.getSymbolName(symbolFile);
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 5px;';
                    
                    img.onload = () => {
                        console.log('✅ 圖片載入成功:', symbolFile);
                    };
                    
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
                    };
                    
                    symbolElement.appendChild(img);
                } else {
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
        this.elements.reels.forEach(reel => {
            if (reel) {
                reel.classList.add('spinning');
                reel.classList.remove('stopping');
                
                // 創建簡單的滾動動畫
                const content = reel.querySelector('.reel-content');
                if (content) {
                    this.createSimpleSpinAnimation(content);
                }
            }
        });
    }
    
    createSimpleSpinAnimation(content) {
        // 創建足夠多的隨機符號用於無縫滾動效果
        const spinSymbols = [];
        // 需要更多符號來填滿滾動區域，避免出現空白
        for (let i = 0; i < 30; i++) {
            const symbolIndex = Math.floor(Math.random() * gameConfig.SYMBOLS.length);
            const symbolFile = gameConfig.SYMBOLS[symbolIndex];
            
            const symbolElement = document.createElement('div');
            symbolElement.className = 'symbol spinning-symbol';
            
            if (symbolFile && (symbolFile.includes('.jpg') || symbolFile.includes('.jpeg') || symbolFile.includes('.png') || symbolFile.includes('.JPG'))) {
                const img = document.createElement('img');
                img.src = symbolFile;
                img.alt = this.getSymbolName(symbolFile);
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 8px;';
                symbolElement.appendChild(img);
            } else {
                symbolElement.textContent = this.getSymbolEmoji(symbolFile);
            }
            
            spinSymbols.push(symbolElement);
        }
        
        // 清空內容並添加滾動符號
        content.innerHTML = '';
        spinSymbols.forEach(symbol => content.appendChild(symbol));
        
        // 複製符號以創建循環效果
        const duplicateSymbols = [...spinSymbols];
        duplicateSymbols.forEach(symbol => {
            const clone = symbol.cloneNode(true);
            content.appendChild(clone);
        });
        
        // 設定容器樣式確保無縫滾動
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.height = 'auto';
        content.style.minHeight = '600px'; // 確保有足夠高度
        
        // 添加滾動動畫
        content.style.animation = 'seamless-spin 0.1s linear infinite';
    }
    
    hideSpinAnimation(finalBoard) {
        this.elements.reels.forEach((reel, index) => {
            if (reel) {
                setTimeout(() => {
                    reel.classList.remove('spinning');
                    reel.classList.add('stopping');
                    
                    const content = reel.querySelector('.reel-content');
                    if (content) {
                        // 停止動畫
                        content.style.animation = '';
                        
                        // 重置容器樣式
                        content.style.display = 'flex';
                        content.style.flexDirection = 'column';
                        content.style.height = '100%';
                        content.style.minHeight = 'auto';
                        content.style.transform = '';
                        
                        // 渲染最終結果
                        this.renderFinalSymbols(content, finalBoard, index);
                    }
                    
                    setTimeout(() => {
                        reel.classList.remove('stopping');
                    }, 500);
                }, index * 300); // 每個轉輪間隔300ms停止
            }
        });
    }
    
    renderFinalSymbols(content, finalBoard, reelIndex) {
        // 清空內容
        content.innerHTML = '';
        
        // 顯示最終結果
        for (let row = 0; row < 3; row++) {
            const symbolIndex = reelIndex * 3 + row;
            const symbolFile = finalBoard[symbolIndex];
            
            const symbolElement = document.createElement('div');
            symbolElement.className = 'symbol';
            symbolElement.dataset.index = symbolIndex;
            
            if (symbolFile && (symbolFile.includes('.jpg') || symbolFile.includes('.jpeg') || symbolFile.includes('.png') || symbolFile.includes('.JPG'))) {
                const img = document.createElement('img');
                img.src = symbolFile;
                img.alt = this.getSymbolName(symbolFile);
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 5px;';
                
                img.onerror = () => {
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
                };
                
                symbolElement.appendChild(img);
            } else {
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
            }
            
            content.appendChild(symbolElement);
        }
    }
    
    highlightWinningSymbols(winningPositions) {
        this.elements.reels.forEach(reel => {
            const symbols = reel.querySelectorAll('.symbol');
            symbols.forEach(symbol => symbol.classList.remove('winning'));
        });
        
        winningPositions.forEach(position => {
            const reelIndex = Math.floor(position / 3);
            const reel = this.elements.reels[reelIndex];
            if (reel) {
                const symbols = reel.querySelectorAll('.symbol');
                const symbolIndex = position % 3;
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
    
    getSymbolName(symbolFile) {
        if (!gameConfig) return '未知符號';
        const index = gameConfig.SYMBOLS.indexOf(symbolFile);
        return index >= 0 ? gameConfig.SYMBOL_NAMES[index] : '未知符號';
    }
    
    getSymbolEmoji(symbolFile) {
        if (!gameConfig) return '❓';
        const index = gameConfig.SYMBOLS.indexOf(symbolFile);
        return index >= 0 ? gameConfig.SYMBOL_EMOJIS[index] : '❓';
    }
}

// ===== 遊戲邏輯控制器 =====
class GameController {
    constructor(gameState, domManager) {
        this.gameState = gameState;
        this.dom = domManager;
    }
    
    async spin() {
        console.log('🎰 開始轉動...');
        
        // 更新UI
        this.dom.updateDisplay(this.gameState);
        this.dom.updateButtons(this.gameState);
        this.dom.showSpinAnimation();
        this.dom.showMessage('🎰 轉動中...', 'info');
        
        try {
            // 調用後端API（在動畫開始時就獲取結果）
            const resultPromise = this.gameState.spin();
            
            // 等待轉動動畫
            await this.sleep(2000);
            
            // 獲取結果
            const result = await resultPromise;
            
            if (result) {
                // 停止動畫並顯示結果
                this.dom.hideSpinAnimation(result.board);
                
                // 等待停止動畫完成
                await this.sleep(1500);
                
                // 處理中獎
                if (result.totalWin > 0) {
                    this.dom.highlightWinningSymbols(result.winningPositions);
                    this.dom.showWinEffect(result.totalWin);
                    const winMessage = result.message || `🎉 恭喜中獎！獲得 ${result.totalWin} 金幣！`;
                    this.dom.showMessage(winMessage, 'win');
                } else {
                    const loseMessage = result.message || '😔 沒有中獎，再試一次吧！';
                    this.dom.showMessage(loseMessage, 'lose');
                }
            } else {
                this.dom.showMessage('❌ 轉動失敗，請重試', 'lose');
            }
            
            // 更新顯示
            this.dom.updateDisplay(this.gameState);
            this.dom.updateButtons(this.gameState);
            
            console.log('✅ 轉動完成');
            
            return result;
            
        } catch (error) {
            console.error('❌ 轉動過程發生錯誤:', error);
            this.dom.showMessage('❌ 轉動失敗，請重試', 'lose');
            return false;
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
    constructor(gameController, domManager) {
        this.gameController = gameController;
        this.dom = domManager;
        this.gameState = gameController.gameState;
        this.initEvents();
    }
    
    initEvents() {
        // 轉動按鈕
        if (this.dom.elements.spinBtn) {
            this.dom.elements.spinBtn.addEventListener('click', () => {
                this.gameController.spin();
            });
        }
        
        // 自動模式
        if (this.dom.elements.autoBtn) {
            this.dom.elements.autoBtn.addEventListener('click', () => {
                this.gameController.startAutoMode();
            });
        }
        
        if (this.dom.elements.stopAutoBtn) {
            this.dom.elements.stopAutoBtn.addEventListener('click', () => {
                this.gameController.stopAutoMode();
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
                const bet = parseInt(btn.dataset.bet);
                if (btn.id === 'max-bet') {
                    this.updateBet(gameConfig.MAX_BET);
                } else {
                    this.updateBet(bet);
                }
            });
        });
    }
    
    updateBet(newBet) {
        if (this.gameState.updateBet(newBet)) {
            this.dom.updateDisplay(this.gameState);
            this.updateBetSelector(newBet);
            this.updateQuickBetButtons(newBet);
        }
    }
    
    adjustBet(direction) {
        const betOptions = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
        const currentIndex = betOptions.indexOf(this.gameState.currentBet);
        const newIndex = Math.max(0, Math.min(betOptions.length - 1, currentIndex + direction));
        this.updateBet(betOptions[newIndex]);
    }
    
    updateBetSelector(bet) {
        if (this.dom.elements.betAmount) {
            this.dom.elements.betAmount.value = bet;
        }
    }
    
    updateQuickBetButtons(currentBet) {
        const quickBetButtons = document.querySelectorAll('.quick-bet-btn[data-bet]');
        quickBetButtons.forEach(btn => {
            const bet = parseInt(btn.dataset.bet);
            if (bet === currentBet || (btn.id === 'max-bet' && currentBet === gameConfig.MAX_BET)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// ===== 遊戲初始化 =====
async function initGame() {
    console.log('🚀 初始化前端拉霸機遊戲...');
    
    try {
        // 生成用戶ID
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.log('👤 用戶ID:', userId);
        
        // 創建API客戶端
        const apiClient = new APIClient();
        
        // 獲取遊戲配置
        console.log('📋 獲取遊戲配置...');
        const configResponse = await apiClient.getConfig();
        if (configResponse.success) {
            gameConfig = configResponse.config;
            console.log('✅ 遊戲配置載入成功');
        } else {
            throw new Error('遊戲配置載入失敗');
        }
        
        // 創建遊戲狀態
        console.log('🎮 創建遊戲狀態...');
        gameState = new GameState(apiClient);
        await gameState.loadSession(userId);
        console.log('✅ 遊戲狀態創建完成');
        
        // 創建DOM管理器
        console.log('🎨 創建DOM管理器...');
        domManager = new DOMManager();
        console.log('✅ DOM管理器創建完成');
        
        // 創建遊戲控制器
        console.log('🎯 創建遊戲控制器...');
        const gameController = new GameController(gameState, domManager);
        console.log('✅ 遊戲控制器創建完成');
        
        // 創建事件管理器
        console.log('🔗 創建事件管理器...');
        eventManager = new EventManager(gameController, domManager);
        console.log('✅ 事件管理器創建完成');
        
        // 初始化顯示
        console.log('📱 初始化顯示...');
        domManager.updateDisplay(gameState);
        domManager.updateButtons(gameState);
        
        // 顯示初始盤面
        const initialBoard = [
            'IMG_1538.JPG', 'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg', 'IMG_1385.JPG',
            'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg', '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg', '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg',
            'IMG_1385.JPG', 'IMG_1538.JPG', 'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg',
            '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg', 'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg', '88750017-4810-4A26-A170-3374C30A44DA_1_105_c.jpeg',
            'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg', 'IMG_1385.JPG', 'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg'
        ];
        domManager.renderBoard(initialBoard);
        
        // 根據模式顯示不同訊息
        if (apiClient.useLocalMode) {
            domManager.showMessage('🎰 前端拉霸機準備就緒！（本地模式）從最左側開始連續3個以上相同圖片才能中獎！', 'info');
            console.log('ℹ️ 運行在本地模式，所有遊戲邏輯在瀏覽器中執行');
        } else {
            domManager.showMessage('🎰 後端拉霸機準備就緒！從最左側開始連續3個以上相同圖片才能中獎！', 'info');
            console.log('ℹ️ 運行在服務器模式，連接到後端API');
        }
        console.log('✅ 顯示初始化完成');
        
        console.log('✅ 前端遊戲初始化完成！');
        
    } catch (e) {
        console.error('❌ 前端遊戲初始化失敗:', e);
        console.error('錯誤詳情:', e.message);
        console.error('錯誤堆疊:', e.stack);
        
        const errorMsg = `前端遊戲初始化失敗：${e.message}`;
        if (document.getElementById('message')) {
            document.getElementById('message').textContent = errorMsg;
            document.getElementById('message').className = 'message lose';
        } else {
            alert(errorMsg);
        }
    }
}

// 頁面載入完成後初始化遊戲
document.addEventListener('DOMContentLoaded', initGame); 