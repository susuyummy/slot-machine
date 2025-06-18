// ===== 遊戲配置 =====
const CONFIG = {
    REEL_COUNT: 5,
    ROW_COUNT: 3,
    WHEEL_LENGTH: 30,
    MIN_BET: 10,
    MAX_BET: 100,
    INITIAL_BALANCE: 1000,
    SPIN_DURATION: 2500,
    DEBUG_MODE: true,
    PAYLINE_MODE: "leftmost" // "leftmost"=國際主流規則, "any"=任意連續三連都算
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
    debugContent: document.getElementById('debug-content'),
    
    // 模式切換
    modeButtons: document.querySelectorAll('.mode-btn'),
    modeDescription: document.getElementById('mode-description')
};

// ===== 符號配置驗證 =====
function validateSymbolsConfig() {
    const filesLength = SYMBOLS.files.length;
    const typesLength = SYMBOLS.types.length;
    const namesLength = SYMBOLS.names.length;
    
    console.log('🔍 檢查 SYMBOLS 配置...');
    
    // 檢查陣列長度一致性
    if (filesLength !== typesLength || typesLength !== namesLength) {
        console.error('❌ SYMBOLS 配置錯誤！陣列長度不一致：', {
            files: filesLength,
            types: typesLength,
            names: namesLength
        });
        return false;
    }
    
    // 檢查最小符號數量（至少6個）
    if (filesLength < 6) {
        console.error('❌ SYMBOLS 符號數量不足！至少需要6個符號，目前只有', filesLength, '個');
        return false;
    }
    
    // 檢查每個符號的完整性
    for (let i = 0; i < filesLength; i++) {
        if (!SYMBOLS.files[i] || !SYMBOLS.types[i] || !SYMBOLS.names[i]) {
            console.error(`❌ 符號 ${i} 配置不完整：`, {
                file: SYMBOLS.files[i],
                type: SYMBOLS.types[i],
                name: SYMBOLS.names[i]
            });
            return false;
        }
    }
    
    console.log('✅ SYMBOLS 配置正確，共有', filesLength, '個符號：');
    for (let i = 0; i < filesLength; i++) {
        console.log(`  ${i}: ${SYMBOLS.names[i]} (${SYMBOLS.types[i]}) - ${SYMBOLS.files[i]}`);
    }
    return true;
}

// ===== 盤面資料驗證 =====
function validateBoard(board) {
    if (!board || !Array.isArray(board)) {
        console.error('❌ 盤面資料無效：', board);
        return false;
    }
    
    if (board.length !== CONFIG.REEL_COUNT) {
        console.error('❌ 盤面轉輪數量錯誤：期望', CONFIG.REEL_COUNT, '實際', board.length);
        return false;
    }
    
    for (let col = 0; col < board.length; col++) {
        if (!Array.isArray(board[col]) || board[col].length !== CONFIG.ROW_COUNT) {
            console.error(`❌ 轉輪 ${col} 資料錯誤：期望 ${CONFIG.ROW_COUNT} 排，實際`, board[col]);
            return false;
        }
        
        for (let row = 0; row < board[col].length; row++) {
            const symbolIndex = board[col][row];
            if (typeof symbolIndex !== 'number' || symbolIndex < 0 || symbolIndex >= SYMBOLS.files.length) {
                console.error(`❌ 位置 [${col},${row}] 符號索引無效：${symbolIndex}，有效範圍 0-${SYMBOLS.files.length - 1}`);
                return false;
            }
        }
    }
    
    return true;
}

// ===== 符號索引修復 =====
function fixSymbolIndex(index, position = '') {
    if (typeof index !== 'number' || index < 0 || index >= SYMBOLS.files.length) {
        console.warn(`⚠️  修復無效符號索引 ${position}: ${index} → 0`);
        return 0; // 默認使用第一個符號
    }
    return index;
}

// ===== 工具函數 =====
class GameUtils {
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static getRandomBoard() {
        const maxIndex = SYMBOLS.files.length - 1;
        const board = Array.from({length: CONFIG.REEL_COUNT}, (_, col) =>
            Array.from({length: CONFIG.ROW_COUNT}, (_, row) => {
                const randomIndex = Math.floor(Math.random() * SYMBOLS.files.length);
                const safeIndex = fixSymbolIndex(randomIndex, `[${col},${row}]`);
                return safeIndex;
            })
        );
        
        // 驗證生成的盤面
        if (!validateBoard(board)) {
            console.error('❌ 生成的隨機盤面無效，使用安全盤面');
            return this.getSafeBoard();
        }
        
        GameUtils.debugLog('✅ 生成隨機盤面：', board);
        return board;
    }
    
    static getSafeBoard() {
        // 生成安全的預設盤面（全部使用第一個符號）
        const safeBoard = Array.from({length: CONFIG.REEL_COUNT}, () =>
            Array.from({length: CONFIG.ROW_COUNT}, () => 0)
        );
        console.log('🛡️  使用安全盤面：', safeBoard);
        return safeBoard;
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
        console.log('🎨 開始渲染轉輪，盤面資料：', board);
        
        // A. 驗證盤面資料
        if (!validateBoard(board)) {
            console.error('❌ 盤面資料驗證失敗，使用安全盤面');
            board = GameUtils.getSafeBoard();
        }
        
        let renderErrors = [];
        
        for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
            const reel = elements.reels[col];
            if (!reel) {
                console.error(`❌ 找不到轉輪 ${col} 的DOM元素`);
                renderErrors.push(`轉輪${col}DOM缺失`);
                continue;
            }
            
            const inner = reel.querySelector('.reel-inner');
            if (!inner) {
                console.error(`❌ 找不到轉輪 ${col} 的內容容器`);
                renderErrors.push(`轉輪${col}內容容器缺失`);
                continue;
            }
            
            // 清除舊內容並重置樣式
            inner.innerHTML = '';
            inner.style.transition = 'none';
            inner.style.transform = 'translateY(0px)';
            inner.style.display = 'flex';
            inner.style.flexDirection = 'column';
            
            let symbolsRendered = 0;
            
            for (let row = 0; row < CONFIG.ROW_COUNT; row++) {
                const symbolIndex = fixSymbolIndex(board[col][row], `[${col},${row}]`);
                
                // B. 檢查符號索引有效性
                console.log(`🔍 位置[${col},${row}] 符號索引:${symbolIndex} 檔案:${SYMBOLS.files[symbolIndex]} 名稱:${SYMBOLS.names[symbolIndex]}`);
                
                const symbolElement = this.createSymbolElement(symbolIndex, col, row);
                if (symbolElement) {
                    inner.appendChild(symbolElement);
                    symbolsRendered++;
                } else {
                    renderErrors.push(`位置[${col},${row}]符號創建失敗`);
                }
            }
            
            console.log(`✅ 轉輪 ${col} 渲染完成，符號數量: ${symbolsRendered}/${CONFIG.ROW_COUNT}`);
            
            if (symbolsRendered === 0) {
                // 如果沒有任何符號渲染成功，創建緊急fallback
                this.createEmergencyFallback(inner, col);
                renderErrors.push(`轉輪${col}需要緊急fallback`);
            }
        }
        
        // 記錄渲染結果
        if (renderErrors.length > 0) {
            console.warn('⚠️  渲染過程中發現問題：', renderErrors);
            GameUtils.showMessage(`⚠️  部分符號顯示異常：${renderErrors.join(', ')}`, '#f39c12');
        } else {
            console.log('✅ 所有轉輪渲染成功');
        }
        
        gameState.lastBoard = board;
        GameUtils.debugLog('Board rendered successfully, final board:', board);
    }
    
    static createSymbolElement(symbolIndex, col, row) {
        try {
            // 創建圖片元素
            const img = document.createElement('img');
            img.src = SYMBOLS.files[symbolIndex];
            img.alt = SYMBOLS.names[symbolIndex];
            img.style.cssText = 'width:66px;height:66px;object-fit:cover;border:2px solid #fff;border-radius:5px;margin:2px auto;background:#f8f9fa;display:block;flex-shrink:0;';
            
            // 添加調試屬性
            img.dataset.col = col;
            img.dataset.row = row;
            img.dataset.symbol = symbolIndex;
            
            // C. 圖片載入錯誤處理
            img.onerror = () => {
                console.warn(`🖼️  圖片載入失敗: ${img.src} 位置[${col},${row}]`);
                this.replaceWithEmoji(img, symbolIndex, col, row);
            };
            
            // 設置載入超時（5秒）
            setTimeout(() => {
                if (!img.complete || img.naturalHeight === 0) {
                    console.warn(`⏰ 圖片載入超時: ${img.src} 位置[${col},${row}]`);
                    this.replaceWithEmoji(img, symbolIndex, col, row);
                }
            }, 5000);
            
            return img;
            
        } catch (error) {
            console.error(`❌ 創建符號元素失敗 位置[${col},${row}]:`, error);
            return this.createEmojiElement(symbolIndex, col, row);
        }
    }
    
    static replaceWithEmoji(imgElement, symbolIndex, col, row) {
        const emoji = this.createEmojiElement(symbolIndex, col, row);
        if (emoji && imgElement.parentNode) {
            imgElement.parentNode.replaceChild(emoji, imgElement);
            console.log(`🔄 已替換為emoji 位置[${col},${row}]`);
        }
    }
    
    static createEmojiElement(symbolIndex, col, row) {
        try {
            const emoji = document.createElement('div');
            emoji.style.cssText = 'width:66px;height:66px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f8f9fa;border:2px solid #fff;border-radius:5px;margin:2px auto;flex-shrink:0;';
            emoji.textContent = SYMBOLS.names[symbolIndex]?.split(' ')[0] || '❓';
            emoji.dataset.col = col;
            emoji.dataset.row = row;
            emoji.dataset.symbol = symbolIndex;
            emoji.title = `${SYMBOLS.names[symbolIndex]} (${symbolIndex})`;
            return emoji;
        } catch (error) {
            console.error(`❌ 創建emoji元素失敗 位置[${col},${row}]:`, error);
            return null;
        }
    }
    
    static createEmergencyFallback(container, col) {
        console.log(`🚨 為轉輪 ${col} 創建緊急fallback`);
        for (let row = 0; row < CONFIG.ROW_COUNT; row++) {
            const fallback = document.createElement('div');
            fallback.style.cssText = 'width:66px;height:66px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:#ff6b6b;border:2px solid #fff;border-radius:5px;margin:2px auto;flex-shrink:0;color:white;';
            fallback.textContent = '⚠️';
            fallback.title = `緊急fallback 位置[${col},${row}]`;
            container.appendChild(fallback);
        }
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
        GameUtils.debugLog(`Highlighting line ${lineIndex}:`, payline);
        
        payline.forEach(([col, row]) => {
            const reel = elements.reels[col];
            const inner = reel.querySelector('.reel-inner');
            const symbols = inner.children; // 使用 children 而不是 querySelectorAll
            
            if (symbols[row]) {
                symbols[row].classList.add('winning-symbol');
                GameUtils.debugLog(`Added highlight to symbol at [${col},${row}]`);
            } else {
                GameUtils.debugLog(`No symbol found at [${col},${row}], available: ${symbols.length}`);
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
            console.log('🎬 開始轉輪動畫...');
            
            try {
                // 生成最終結果並驗證
                let finalBoard = GameUtils.getRandomBoard();
                console.log('🎲 生成最終盤面：', finalBoard);
                
                // 二次驗證最終盤面
                if (!validateBoard(finalBoard)) {
                    console.error('❌ 最終盤面驗證失敗，使用安全盤面');
                    finalBoard = GameUtils.getSafeBoard();
                }
                
                // 為每個轉輪創建動畫
                const reelAnimations = [];
                let animationErrors = [];
                
                for (let col = 0; col < CONFIG.REEL_COUNT; col++) {
                    try {
                        const reel = elements.reels[col];
                        if (!reel) {
                            animationErrors.push(`轉輪${col}不存在`);
                            continue;
                        }
                        
                        const inner = reel.querySelector('.reel-inner');
                        if (!inner) {
                            animationErrors.push(`轉輪${col}內容容器不存在`);
                            continue;
                        }
                        
                        // 創建動畫符號（使用安全索引）
                        const symbolCount = 15;
                        inner.innerHTML = '';
                        
                        for (let i = 0; i < symbolCount; i++) {
                            const randomIndex = Math.floor(Math.random() * SYMBOLS.files.length);
                            const safeIndex = fixSymbolIndex(randomIndex, `動畫[${col},${i}]`);
                            
                            const img = document.createElement('img');
                            img.src = SYMBOLS.files[safeIndex];
                            img.alt = SYMBOLS.names[safeIndex];
                            img.style.cssText = 'width:66px;height:66px;object-fit:cover;border:2px solid #fff;border-radius:5px;margin:2px auto;background:#f8f9fa;display:block;flex-shrink:0;';
                            
                            // 動畫期間的錯誤處理
                            img.onerror = () => {
                                const emoji = document.createElement('div');
                                emoji.style.cssText = 'width:66px;height:66px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:#f8f9fa;border:2px solid #fff;border-radius:5px;margin:2px auto;flex-shrink:0;';
                                emoji.textContent = SYMBOLS.names[safeIndex]?.split(' ')[0] || '❓';
                                if (img.parentNode) {
                                    img.parentNode.replaceChild(emoji, img);
                                }
                            };
                            
                            inner.appendChild(img);
                        }
                        
                        // 設置初始位置
                        inner.style.transition = 'none';
                        inner.style.transform = 'translateY(0px)';
                        
                        // 開始動畫
                        const animationDuration = duration + (col * 200);
                        const animation = this.animateReel(inner, animationDuration, col);
                        reelAnimations.push(animation);
                        
                    } catch (colError) {
                        console.error(`❌ 轉輪 ${col} 動畫設置失敗：`, colError);
                        animationErrors.push(`轉輪${col}動畫失敗`);
                    }
                }
                
                // 如果所有動畫都失敗，直接渲染結果
                if (reelAnimations.length === 0) {
                    console.error('❌ 所有轉輪動畫都失敗，直接渲染結果');
                    RenderSystem.renderReels(finalBoard);
                    resolve(finalBoard);
                    return;
                }
                
                // 等待所有動畫完成（帶超時保護）
                const animationTimeout = setTimeout(() => {
                    console.warn('⏰ 動畫超時，強制完成');
                    RenderSystem.renderReels(finalBoard);
                    resolve(finalBoard);
                }, duration + 3000);
                
                Promise.all(reelAnimations).then(() => {
                    clearTimeout(animationTimeout);
                    console.log('✅ 動畫完成，渲染最終結果');
                    RenderSystem.renderReels(finalBoard);
                    resolve(finalBoard);
                }).catch((animError) => {
                    clearTimeout(animationTimeout);
                    console.error('❌ 動畫執行錯誤：', animError);
                    RenderSystem.renderReels(finalBoard);
                    resolve(finalBoard);
                });
                
                if (animationErrors.length > 0) {
                    console.warn('⚠️  動畫過程中的問題：', animationErrors);
                }
                
            } catch (error) {
                console.error('❌ 動畫系統嚴重錯誤：', error);
                const errorBoard = GameUtils.getSafeBoard();
                RenderSystem.renderReels(errorBoard);
                resolve(errorBoard);
            }
        });
    }
    
    static animateReel(inner, duration, col) {
        return new Promise((resolve) => {
            try {
                console.log(`🎯 開始轉輪 ${col} 動畫，持續時間: ${duration}ms`);
                
                const startTime = performance.now();
                const animDuration = 1500 + Math.random() * 1000;
                const totalDistance = 1050;
                
                const animate = (currentTime) => {
                    try {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / animDuration, 1);
                        
                        // 使用緩動函數
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        const currentDistance = totalDistance * easeOut;
                        
                        if (inner && inner.style) {
                            inner.style.transform = `translateY(-${currentDistance}px)`;
                        }
                        
                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            console.log(`✅ 轉輪 ${col} 動畫完成`);
                            resolve();
                        }
                    } catch (frameError) {
                        console.error(`❌ 轉輪 ${col} 動畫幀錯誤：`, frameError);
                        resolve(); // 即使出錯也要resolve，避免卡住
                    }
                };
                
                requestAnimationFrame(animate);
                
                // 動畫超時保護
                setTimeout(() => {
                    console.warn(`⏰ 轉輪 ${col} 動畫超時，強制完成`);
                    resolve();
                }, animDuration + 1000);
                
            } catch (error) {
                console.error(`❌ 轉輪 ${col} 動畫初始化錯誤：`, error);
                resolve();
            }
        });
    }
}

// ===== 獎金計算系統 =====
class PayoutSystem {
    static calculateWin(board, betAmount) {
        GameUtils.debugLog('=== 開始計算中獎 ===');
        GameUtils.debugLog('盤面:', board);
        GameUtils.debugLog('下注金額:', betAmount);
        
        // 顯示盤面符號類型
        const boardTypes = board.map(col => 
            col.map(symbolIndex => SYMBOLS.types[symbolIndex])
        );
        GameUtils.debugLog('盤面符號類型:', boardTypes);
        
        let result = {
            winAmount: 0,
            message: '',
            free: false,
            winLines: []
        };

        // 檢查每條中獎線
        PAYLINES.forEach((payline, lineIndex) => {
            GameUtils.debugLog(`--- 檢查中獎線 ${lineIndex + 1} ---`);
            const lineResult = this.checkPayline(board, payline, betAmount);
            if (lineResult.winAmount > 0) {
                result.winAmount += lineResult.winAmount;
                result.message += (result.message ? ' + ' : '') + lineResult.message;
                result.winLines.push(lineIndex);
                GameUtils.debugLog(`中獎線 ${lineIndex + 1} 中獎！`, lineResult);
            } else {
                GameUtils.debugLog(`中獎線 ${lineIndex + 1} 沒有中獎`);
            }
        });

        // 檢查特殊符號（只檢查免費轉盤）
        const specialResult = this.checkSpecialSymbols(board);
        result.free = specialResult.free;
        
        if (specialResult.free) {
            result.message += ' 🎁 獲得免費轉盤!';
            GameUtils.debugLog('觸發免費轉盤！');
        }

        GameUtils.debugLog('=== 最終中獎結果 ===', result);
        return result;
    }
    
    static checkPayline(board, payline, betAmount) {
        // 獲取這條線上的符號索引
        const line = payline.map(([col, row]) => board[col][row]);
        
        GameUtils.debugLog('Checking payline:', {
            payline,
            mode: CONFIG.PAYLINE_MODE,
            symbolIndexes: line,
            symbolTypes: line.map(idx => SYMBOLS.types[idx]),
            symbolNames: line.map(idx => SYMBOLS.names[idx])
        });
        
        let winAmount = 0;
        let message = '';
        
        if (CONFIG.PAYLINE_MODE === "leftmost") {
            // 國際主流規則：只從最左起算連線
            const firstSymbolIndex = line[0];
            const firstSymbolType = SYMBOLS.types[firstSymbolIndex];
            const firstSymbolName = SYMBOLS.names[firstSymbolIndex];
            
            let consecutiveCount = 1;
            
            // 檢查後續符號是否與第一個符號相同
            for (let i = 1; i < line.length; i++) {
                if (SYMBOLS.types[line[i]] === firstSymbolType) {
                    consecutiveCount++;
                } else {
                    break; // 遇到不同符號就停止
                }
            }
            
            GameUtils.debugLog('Leftmost mode analysis:', {
                firstSymbolType,
                firstSymbolName,
                consecutiveCount,
                isWin: consecutiveCount >= 3
            });
            
            if (consecutiveCount >= 3) {
                const multiplier = this.getMultiplier(firstSymbolType, consecutiveCount);
                winAmount = betAmount * multiplier;
                message = `${consecutiveCount}個${firstSymbolName} ×${multiplier}`;
                
                GameUtils.debugLog('Leftmost win detected:', {
                    symbolType: firstSymbolType,
                    count: consecutiveCount,
                    multiplier,
                    winAmount,
                    message
                });
            }
            
        } else if (CONFIG.PAYLINE_MODE === "any") {
            // 自訂規則：一條線內任意連續三連（或更多）都算
            let maxCount = 1;
            let maxType = SYMBOLS.types[line[0]];
            let maxSymbolIndex = line[0];
            let maxStart = 0;
            
            let currentCount = 1;
            let currentType = SYMBOLS.types[line[0]];
            let currentStart = 0;
            
            for (let i = 1; i < line.length; i++) {
                const symbolType = SYMBOLS.types[line[i]];
                
                if (symbolType === currentType) {
                    currentCount++;
                } else {
                    // 檢查當前連續是否為最長
                    if (currentCount > maxCount) {
                        maxCount = currentCount;
                        maxType = currentType;
                        maxSymbolIndex = line[currentStart];
                        maxStart = currentStart;
                    }
                    
                    // 重置為新的符號類型
                    currentType = symbolType;
                    currentCount = 1;
                    currentStart = i;
                }
            }
            
            // 檢查最後一段連續
            if (currentCount > maxCount) {
                maxCount = currentCount;
                maxType = currentType;
                maxSymbolIndex = line[currentStart];
                maxStart = currentStart;
            }
            
            GameUtils.debugLog('Any mode analysis:', {
                maxType,
                maxCount,
                maxStart,
                isWin: maxCount >= 3
            });
            
            if (maxCount >= 3) {
                const multiplier = this.getMultiplier(maxType, maxCount);
                winAmount = betAmount * multiplier;
                message = `${maxCount}個${SYMBOLS.names[maxSymbolIndex]} ×${multiplier}`;
                
                GameUtils.debugLog('Any mode win detected:', {
                    symbolType: maxType,
                    count: maxCount,
                    startPosition: maxStart,
                    multiplier,
                    winAmount,
                    message
                });
            }
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
        console.log('🎰 開始轉動...');
        console.log('當前狀態：', {
            isSpinning: gameState.isSpinning,
            balance: gameState.balance,
            currentBet: gameState.currentBet,
            freeSpin: gameState.freeSpin,
            isAutoMode: gameState.isAutoMode
        });
        
        if (gameState.isSpinning) {
            console.warn('⚠️  已在轉動中，忽略重複請求');
            return;
        }
        
        let spinSuccessful = false;
        
        try {
            GameUtils.clearMessage();
            
            // 檢查餘額
            if (!gameState.freeSpin && gameState.balance < gameState.currentBet) {
                GameUtils.showMessage('💰 餘額不足！', '#e74c3c');
                console.log('❌ 餘額不足：', gameState.balance, '<', gameState.currentBet);
                return;
            }
            
            // 設置遊戲狀態
            console.log('🔄 設置轉動狀態...');
            gameState.isSpinning = true;
            this.updateButtonStates();
            
            // 扣除下注金額
            if (!gameState.freeSpin) {
                GameUtils.updateBalance(-gameState.currentBet);
                console.log('💰 扣除下注金額：', gameState.currentBet, '剩餘：', gameState.balance);
            } else {
                console.log('🎁 免費轉盤，不扣除金額');
            }
            
            const wasFreeSpin = gameState.freeSpin;
            gameState.freeSpin = false;
            
            console.log('🎲 開始轉動動畫...');
            
            // 執行轉動動畫（帶超時保護）
            const spinTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('轉動超時')), CONFIG.SPIN_DURATION + 5000);
            });
            
            const board = await Promise.race([
                AnimationSystem.spinAllReels(),
                spinTimeout
            ]);
            
            console.log('🎯 轉動完成，最終盤面：', board);
            
            // 驗證最終盤面
            if (!validateBoard(board)) {
                console.error('❌ 最終盤面無效，使用安全盤面');
                const safeBoard = GameUtils.getSafeBoard();
                RenderSystem.renderReels(safeBoard);
                board = safeBoard;
            }
            
            // 計算獎金
            console.log('💰 計算獎金...');
            const result = PayoutSystem.calculateWin(board, gameState.currentBet);
            console.log('💰 獎金計算結果：', result);
            
            // 處理結果
            await this.handleResult(result, wasFreeSpin);
            
            spinSuccessful = true;
            console.log('✅ 轉動完成');
            
        } catch (error) {
            console.error('❌ 轉動過程發生錯誤：', error);
            
            // 錯誤恢復
            try {
                console.log('🔧 執行錯誤恢復...');
                
                // 確保有盤面顯示
                if (!gameState.lastBoard || !validateBoard(gameState.lastBoard)) {
                    const emergencyBoard = GameUtils.getSafeBoard();
                    RenderSystem.renderReels(emergencyBoard);
                    console.log('🛡️  使用緊急盤面');
                }
                
                // 如果扣了錢但轉動失敗，退還金額
                if (!gameState.freeSpin && !spinSuccessful) {
                    GameUtils.updateBalance(gameState.currentBet);
                    console.log('💰 轉動失敗，退還下注金額：', gameState.currentBet);
                }
                
                GameUtils.showMessage(`❌ 轉動失敗：${error.message}，已自動恢復`, '#e74c3c');
                
            } catch (recoveryError) {
                console.error('❌ 錯誤恢復失敗：', recoveryError);
                GameUtils.showMessage('❌ 系統錯誤，請重新載入頁面', '#e74c3c');
            }
            
        } finally {
            console.log('🔄 重置遊戲狀態...');
            this.resetGameState();
        }
    }
    
    static async handleResult(result, wasFreeSpin = false) {
        console.log('🎯 處理轉動結果...');
        console.log('結果詳情：', result);
        console.log('是否為免費轉盤：', wasFreeSpin);
        
        try {
            // 顯示中獎
            if (result.winAmount > 0) {
                console.log('🎊 有中獎！金額：', result.winAmount);
                RenderSystem.showWinLines(result.winLines);
                GameUtils.updateBalance(result.winAmount);
                GameUtils.showMessage(result.message + ` 🎊 贏得 ${result.winAmount} 點！`, '#27ae60');
                RenderSystem.createWinEffect(result.winAmount);
            } else {
                console.log('😔 沒有中獎');
                GameUtils.showMessage('😔 沒有中獎，再試一次吧！', '#e74c3c');
            }
            
            // 處理免費轉盤
            if (result.free) {
                console.log('🎁 觸發免費轉盤！');
                gameState.freeSpin = true;
                GameUtils.showMessage('🎁 免費轉盤啟動！', '#3498db');
                
                await GameUtils.sleep(1500);
                
                // 自動執行免費轉盤（帶安全檢查）
                setTimeout(() => {
                    console.log('🔄 檢查免費轉盤執行條件...');
                    console.log('當前狀態：', {
                        isSpinning: gameState.isSpinning,
                        freeSpin: gameState.freeSpin
                    });
                    
                    if (!gameState.isSpinning && gameState.freeSpin) {
                        console.log('✅ 執行免費轉盤');
                        this.spin();
                    } else {
                        console.warn('⚠️  免費轉盤執行條件不符合');
                    }
                }, 500);
                return; // 免費轉盤會自動執行，不需要重置狀態
            }
            
            // 如果是自動模式且不是免費轉盤，繼續自動轉動
            if (gameState.isAutoMode && !wasFreeSpin && !result.free) {
                console.log('🔄 自動模式，準備下一次轉動...');
                setTimeout(() => {
                    this.continueAutoMode();
                }, 1000);
            } else if (wasFreeSpin) {
                console.log('🎁 免費轉盤結束');
            }
            
            console.log('✅ 結果處理完成');
            
        } catch (error) {
            console.error('❌ 處理結果時發生錯誤：', error);
            
            // 結果處理錯誤恢復
            try {
                // 確保遊戲狀態正確
                if (result && result.winAmount > 0) {
                    // 如果有獎金但處理失敗，至少要給錢
                    GameUtils.updateBalance(result.winAmount);
                    console.log('💰 錯誤恢復：補發獎金', result.winAmount);
                }
                
                GameUtils.showMessage(`⚠️  結果處理異常但已恢復：${error.message}`, '#f39c12');
                
            } catch (recoveryError) {
                console.error('❌ 結果處理恢復失敗：', recoveryError);
                GameUtils.showMessage('❌ 結果處理失敗，請檢查餘額', '#e74c3c');
            }
        }
    }
    
    static continueAutoMode() {
        console.log('🔄 檢查自動模式繼續條件...');
        console.log('自動模式狀態：', {
            isAutoMode: gameState.isAutoMode,
            isSpinning: gameState.isSpinning,
            balance: gameState.balance,
            currentBet: gameState.currentBet,
            canAfford: gameState.balance >= gameState.currentBet
        });
        
        if (gameState.isAutoMode && !gameState.isSpinning && gameState.balance >= gameState.currentBet) {
            console.log('✅ 繼續自動轉動');
            this.spin();
        } else if (gameState.balance < gameState.currentBet) {
            console.log('❌ 餘額不足，停止自動模式');
            this.stopAutoMode();
            GameUtils.showMessage('💰 餘額不足，自動模式已停止', '#e74c3c');
        } else if (!gameState.isAutoMode) {
            console.log('ℹ️  自動模式已關閉');
        } else if (gameState.isSpinning) {
            console.log('⚠️  仍在轉動中，等待下次檢查');
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
        console.log('🔄 重置遊戲狀態...');
        console.log('重置前狀態：', {
            isSpinning: gameState.isSpinning,
            isAutoMode: gameState.isAutoMode,
            freeSpin: gameState.freeSpin,
            balance: gameState.balance
        });
        
        // C. 確保狀態正確重置
        gameState.isSpinning = false;
        this.updateButtonStates();
        
        // 檢查按鈕狀態
        const spinDisabled = elements.spinButton.disabled;
        const autoDisabled = elements.autoButton.disabled;
        
        console.log('重置後狀態：', {
            isSpinning: gameState.isSpinning,
            spinButtonDisabled: spinDisabled,
            autoButtonDisabled: autoDisabled,
            lastBoard: gameState.lastBoard ? '有' : '無'
        });
        
        // 如果按鈕仍然被禁用，強制啟用
        if (spinDisabled && !gameState.isSpinning) {
            console.warn('⚠️  強制啟用轉動按鈕');
            elements.spinButton.disabled = false;
        }
        
        GameUtils.debugLog('✅ 遊戲狀態重置完成');
    }
}

// ===== 模式切換系統 =====
class ModeSystem {
    static setMode(mode) {
        CONFIG.PAYLINE_MODE = mode;
        this.updateModeButtons();
        this.updateModeDescription();
        GameUtils.debugLog('Mode changed to:', mode);
    }
    
    static updateModeButtons() {
        elements.modeButtons.forEach(btn => {
            const btnMode = btn.dataset.mode;
            btn.classList.toggle('active', btnMode === CONFIG.PAYLINE_MODE);
        });
    }
    
    static updateModeDescription() {
        const descriptions = {
            leftmost: '從最左邊開始連續相同符號',
            any: '線上任意位置連續3個以上相同符號'
        };
        elements.modeDescription.textContent = descriptions[CONFIG.PAYLINE_MODE] || '';
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
        
        // 模式切換按鈕
        elements.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                ModeSystem.setMode(mode);
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
        console.log('🚀 開始初始化遊戲...');
        
        try {
            // A. 驗證符號配置
            if (!validateSymbolsConfig()) {
                alert('❌ 遊戲配置錯誤，請檢查符號設定！');
                return;
            }
            
            // B. 檢查DOM元素
            const missingElements = [];
            if (!elements.spinButton) missingElements.push('轉動按鈕');
            if (!elements.balanceDisplay) missingElements.push('餘額顯示');
            if (!elements.messageDiv) missingElements.push('訊息區域');
            if (elements.reels.some(reel => !reel)) missingElements.push('轉輪容器');
            
            if (missingElements.length > 0) {
                console.error('❌ 缺少必要的DOM元素：', missingElements);
                alert(`❌ 頁面載入不完整，缺少：${missingElements.join(', ')}`);
                return;
            }
            
            // 載入餘額
            GameUtils.loadBalance();
            
            // 初始化下注
            BettingSystem.setBet(CONFIG.MIN_BET);
            
            // 初始化模式
            ModeSystem.updateModeButtons();
            ModeSystem.updateModeDescription();
            
            // C. 初始化盤面（使用安全檢查）
            console.log('🎲 生成初始盤面...');
            const initialBoard = GameUtils.getRandomBoard();
            RenderSystem.renderReels(initialBoard);
            
            // 初始化事件
            EventHandler.init();
            
            // D. 最終狀態檢查
            console.log('🔍 最終狀態檢查：', {
                symbolsCount: SYMBOLS.files.length,
                reelsCount: CONFIG.REEL_COUNT,
                rowsCount: CONFIG.ROW_COUNT,
                balance: gameState.balance,
                initialBet: gameState.currentBet,
                lastBoard: gameState.lastBoard ? '已設置' : '未設置'
            });
            
            console.log('✅ 遊戲初始化成功！');
            GameUtils.showMessage('🎰 歡迎來到拉霸機遊戲！按空白鍵或點擊按鈕開始遊戲', '#3498db');
            
            // 啟動狀態監控系統
            startStateMonitor();
            
        } catch (error) {
            console.error('❌ 初始化過程中發生錯誤：', error);
            alert('❌ 遊戲初始化失敗，請重新載入頁面');
        }
    }
}

// ===== 遊戲啟動 =====
window.addEventListener('DOMContentLoaded', () => {
    GameInitializer.init();
});

// ===== 緊急修復函數 =====
function emergencyRecover() {
    console.log('🚨 執行緊急修復...');
    console.log('修復前狀態：', {
        isSpinning: gameState.isSpinning,
        isAutoMode: gameState.isAutoMode,
        freeSpin: gameState.freeSpin,
        balance: gameState.balance,
        lastBoard: gameState.lastBoard ? '有' : '無',
        symbolsCount: SYMBOLS.files.length
    });
    
    try {
        // 1. 重置所有遊戲狀態
        gameState.isSpinning = false;
        gameState.isAutoMode = false;
        gameState.freeSpin = false;
        
        // 2. 啟用所有按鈕
        if (elements.spinButton) {
            elements.spinButton.disabled = false;
            elements.spinButton.style.opacity = '1';
        }
        if (elements.autoButton) {
            elements.autoButton.disabled = false;
            elements.autoButton.style.opacity = '1';
        }
        if (elements.betInput) {
            elements.betInput.disabled = false;
        }
        
        // 3. 重新驗證符號配置
        if (!validateSymbolsConfig()) {
            console.error('❌ 符號配置無效，遊戲可能無法正常運行');
        }
        
        // 4. 重新渲染安全盤面
        console.log('🛡️  重新渲染安全盤面...');
        const safeBoard = GameUtils.getSafeBoard();
        RenderSystem.renderReels(safeBoard);
        
        // 5. 清理所有動畫和特效
        elements.reels.forEach((reel, col) => {
            if (reel) {
                const inner = reel.querySelector('.reel-inner');
                if (inner) {
                    inner.style.transition = 'none';
                    inner.style.transform = 'translateY(0px)';
                }
            }
        });
        
        // 6. 清除中獎線
        if (elements.winLines) {
            elements.winLines.forEach(line => line.classList.remove('active'));
        }
        
        // 7. 更新顯示
        GameUtils.updateBalanceDisplay();
        GameUtils.clearMessage();
        GameUtils.showMessage('🔧 緊急修復完成，遊戲已重置', '#3498db');
        
        console.log('修復後狀態：', {
            isSpinning: gameState.isSpinning,
            isAutoMode: gameState.isAutoMode,
            freeSpin: gameState.freeSpin,
            spinButtonDisabled: elements.spinButton ? elements.spinButton.disabled : 'N/A',
            lastBoard: gameState.lastBoard ? '有' : '無'
        });
        
        console.log('✅ 緊急修復成功');
        return true;
        
    } catch (error) {
        console.error('❌ 緊急修復失敗：', error);
        
        // 最後手段：重新載入頁面
        if (confirm('緊急修復失敗，是否重新載入頁面？')) {
            window.location.reload();
        }
        
        return false;
    }
}

// ===== 狀態監控系統 =====
function startStateMonitor() {
    console.log('🔍 啟動狀態監控系統...');
    
    setInterval(() => {
        try {
            // 檢查是否長時間卡在轉動狀態
            if (gameState.isSpinning) {
                const now = Date.now();
                if (!gameState.lastSpinTime) {
                    gameState.lastSpinTime = now;
                } else if (now - gameState.lastSpinTime > 10000) { // 10秒
                    console.warn('⚠️  轉動狀態異常，執行修復');
                    emergencyRecover();
                }
            } else {
                gameState.lastSpinTime = null;
            }
            
            // 檢查盤面是否存在
            if (!gameState.lastBoard || !validateBoard(gameState.lastBoard)) {
                console.warn('⚠️  盤面狀態異常');
                const safeBoard = GameUtils.getSafeBoard();
                RenderSystem.renderReels(safeBoard);
            }
            
            // 檢查按鈕狀態
            if (!gameState.isSpinning && elements.spinButton && elements.spinButton.disabled) {
                console.warn('⚠️  按鈕狀態異常，修復中...');
                elements.spinButton.disabled = false;
            }
            
        } catch (error) {
            console.error('❌ 狀態監控錯誤：', error);
        }
    }, 5000); // 每5秒檢查一次
}

// ===== 全局錯誤處理 =====
window.addEventListener('error', (event) => {
    console.error('🚨 全局JavaScript錯誤：', {
        message: event.error?.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
    });
    
    // 檢查是否為關鍵錯誤
    const criticalErrors = [
        'Cannot read',
        'undefined',
        'null',
        'TypeError',
        'ReferenceError'
    ];
    
    const isCritical = criticalErrors.some(errorType => 
        event.error?.message?.includes(errorType)
    );
    
    if (isCritical) {
        console.log('🔧 檢測到關鍵錯誤，嘗試自動修復...');
        setTimeout(() => {
            try {
                emergencyRecover();
            } catch (recoveryError) {
                console.error('❌ 自動修復也失敗了：', recoveryError);
                GameUtils.showMessage('❌ 系統錯誤，建議重新載入頁面', '#e74c3c');
            }
        }, 1000);
    }
});

// ===== Promise 錯誤處理 =====
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 未處理的Promise錯誤：', {
        reason: event.reason,
        promise: event.promise
    });
    
    // 防止錯誤導致頁面崩潰
    event.preventDefault();
    
    // 如果是轉動相關的錯誤，執行修復
    if (event.reason?.message?.includes('spin') || 
        event.reason?.message?.includes('animation') ||
        event.reason?.message?.includes('render')) {
        console.log('🔧 檢測到轉動相關錯誤，執行修復...');
        setTimeout(emergencyRecover, 500);
    }
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
    getBoard: () => gameState.lastBoard,
    validateBoard: (board) => validateBoard(board),
    validateSymbols: () => validateSymbolsConfig(),
    emergencyRecover: () => emergencyRecover(),
    forceRender: (board) => {
        const safeBoard = board || GameUtils.getRandomBoard();
        RenderSystem.renderReels(safeBoard);
    }
}; 