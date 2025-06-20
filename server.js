const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());

// ===== 遊戲配置 =====
const GAME_CONFIG = {
    REELS: 5,
    ROWS: 3,
    SYMBOLS: [
        'IMG_1538.JPG',           // 圖片1
        'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg', // 圖片2
        'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg', // 圖片3
        'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg', // 圖片4
        '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg', // 圖片5
        'IMG_1385.JPG'            // 圖片6
    ],
    SYMBOL_NAMES: ['圖片1', '圖片2', '圖片3', '圖片4', '圖片5', '圖片6'],
    SYMBOL_EMOJIS: ['🎨', '🖼️', '🌟', '✨', '🎯', '🐰'],
    
    // 符號權重 (機率分配)
    SYMBOL_WEIGHTS: [25, 20, 18, 15, 10, 12],
    
    // 賠付線定義
    PAYLINES: [
        [0, 3, 6, 9, 12],   // 上排水平線
        [1, 4, 7, 10, 13],  // 中排水平線  
        [2, 5, 8, 11, 14],  // 下排水平線
        [0, 4, 8, 10, 12],  // 對角線1
        [2, 4, 6, 10, 14]   // 對角線2
    ],
    
    // 賠付表
    PAYTABLE: {
        'IMG_1538.JPG': { 3: 100, 4: 300, 5: 1000 },
        'CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg': { 3: 150, 4: 450, 5: 1500 },
        'C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg': { 3: 200, 4: 600, 5: 2000 },
        'A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg': { 3: 250, 4: 750, 5: 2500 },
        '71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg': { 3: 400, 4: 1200, 5: 4000 },
        'IMG_1385.JPG': { 3: 500, 4: 1500, 5: 3000 }
    },
    
    MIN_BET: 1,
    MAX_BET: 500,
    INITIAL_BALANCE: 1000
};

// ===== 遊戲邏輯類別 =====
class GameLogic {
    constructor() {
        this.config = GAME_CONFIG;
    }
    
    // 生成隨機盤面
    generateRandomBoard() {
        const board = [];
        for (let reel = 0; reel < this.config.REELS; reel++) {
            for (let row = 0; row < this.config.ROWS; row++) {
                const totalWeight = this.config.SYMBOL_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
                let random = Math.random() * totalWeight;
                
                for (let i = 0; i < this.config.SYMBOLS.length; i++) {
                    random -= this.config.SYMBOL_WEIGHTS[i];
                    if (random <= 0) {
                        board.push(this.config.SYMBOLS[i]);
                        break;
                    }
                }
            }
        }
        return board;
    }
    
    // 檢查賠付線中獎（只有最左連線才算）
    checkPayline(symbols) {
        if (!Array.isArray(symbols) || symbols.length !== 5) {
            return { symbol: null, count: 0, payout: 0 };
        }
        
        const firstSymbol = symbols[0];
        if (!firstSymbol) {
            return { symbol: null, count: 0, payout: 0 };
        }
        
        let count = 0;
        for (let i = 0; i < symbols.length; i++) {
            if (symbols[i] === firstSymbol) {
                count++;
            } else {
                break; // 一旦不同就停止計算
            }
        }
        
        if (count < 3) {
            return { symbol: null, count: 0, payout: 0 };
        }
        
        const payout = this.config.PAYTABLE[firstSymbol]?.[count] || 0;
        
        return {
            symbol: firstSymbol,
            count: count,
            payout: payout
        };
    }
    
    // 計算中獎結果
    calculateWin(board, betAmount) {
        console.log('💰 計算中獎結果...');
        console.log('盤面:', board);
        console.log('下注金額:', betAmount);
        
        let totalPayout = 0;
        let winningLines = [];
        let winningPositions = new Set();
        
        // 檢查每條賠付線
        this.config.PAYLINES.forEach((line, lineIndex) => {
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
        
        const finalWin = totalPayout * betAmount;
        
        console.log(`總賠付: ${totalPayout} × ${betAmount} = ${finalWin}`);
        
        return {
            totalWin: finalWin,
            basePayout: totalPayout,
            winningLines,
            winningPositions: Array.from(winningPositions),
            board: board,
            message: this.generateWinMessage(finalWin, winningLines.length)
        };
    }
    
    generateWinMessage(winAmount, lineCount) {
        if (winAmount > 0) {
            return `🎊 中獎！贏得 ${winAmount} 點！(${lineCount}條賠付線中獎)`;
        } else {
            return '再試一次！記住：只有從最左側開始的連續3個以上相同圖片才能中獎';
        }
    }
}

// ===== 用戶會話管理 =====
const userSessions = new Map();

class UserSession {
    constructor(userId) {
        this.userId = userId;
        this.balance = GAME_CONFIG.INITIAL_BALANCE;
        this.lastWin = 0;
        this.totalWins = 0;
        this.spinCount = 0;
        this.gameLogic = new GameLogic();
    }
    
    canAffordBet(betAmount) {
        return this.balance >= betAmount;
    }
    
    updateBalance(amount) {
        this.balance = Math.max(0, this.balance + amount);
        return this.balance;
    }
    
    spin(betAmount) {
        if (!this.canAffordBet(betAmount)) {
            return {
                success: false,
                error: '餘額不足'
            };
        }
        
        // 扣除下注金額
        this.updateBalance(-betAmount);
        this.spinCount++;
        
        // 生成新盤面並計算結果
        const board = this.gameLogic.generateRandomBoard();
        const result = this.gameLogic.calculateWin(board, betAmount);
        
        // 更新餘額和統計
        if (result.totalWin > 0) {
            this.updateBalance(result.totalWin);
            this.lastWin = result.totalWin;
            this.totalWins += result.totalWin;
        } else {
            this.lastWin = 0;
        }
        
        return {
            success: true,
            result: result,
            session: {
                balance: this.balance,
                lastWin: this.lastWin,
                totalWins: this.totalWins,
                spinCount: this.spinCount
            }
        };
    }
    
    getStatus() {
        return {
            balance: this.balance,
            lastWin: this.lastWin,
            totalWins: this.totalWins,
            spinCount: this.spinCount
        };
    }
}

// ===== API路由 =====

// 獲取或創建用戶會話
app.get('/api/session/:userId', (req, res) => {
    const userId = req.params.userId;
    
    if (!userSessions.has(userId)) {
        userSessions.set(userId, new UserSession(userId));
    }
    
    const session = userSessions.get(userId);
    res.json({
        success: true,
        session: session.getStatus()
    });
});

// 轉動拉霸機
app.post('/api/spin', (req, res) => {
    const { userId, betAmount } = req.body;
    
    if (!userId || !betAmount) {
        return res.status(400).json({
            success: false,
            error: '缺少必要參數'
        });
    }
    
    if (betAmount < GAME_CONFIG.MIN_BET || betAmount > GAME_CONFIG.MAX_BET) {
        return res.status(400).json({
            success: false,
            error: '下注金額超出範圍'
        });
    }
    
    if (!userSessions.has(userId)) {
        userSessions.set(userId, new UserSession(userId));
    }
    
    const session = userSessions.get(userId);
    const result = session.spin(betAmount);
    
    res.json(result);
});

// 獲取遊戲配置
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        config: {
            REELS: GAME_CONFIG.REELS,
            ROWS: GAME_CONFIG.ROWS,
            SYMBOLS: GAME_CONFIG.SYMBOLS,
            SYMBOL_NAMES: GAME_CONFIG.SYMBOL_NAMES,
            SYMBOL_EMOJIS: GAME_CONFIG.SYMBOL_EMOJIS,
            PAYTABLE: GAME_CONFIG.PAYTABLE,
            MIN_BET: GAME_CONFIG.MIN_BET,
            MAX_BET: GAME_CONFIG.MAX_BET,
            INITIAL_BALANCE: GAME_CONFIG.INITIAL_BALANCE
        }
    });
});

// 重置用戶會話
app.post('/api/reset/:userId', (req, res) => {
    const userId = req.params.userId;
    userSessions.set(userId, new UserSession(userId));
    
    res.json({
        success: true,
        session: userSessions.get(userId).getStatus()
    });
});

// 服務靜態文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-backend.html'));
});

// 服務其他靜態文件（CSS、JS、圖片等）
app.use(express.static(path.join(__dirname, '.'), {
    index: false // 不自動提供index.html
}));

// 啟動服務器
app.listen(PORT, () => {
    console.log(`🎰 拉霸機後端服務器運行在 http://localhost:${PORT}`);
    console.log(`📊 遊戲配置: ${GAME_CONFIG.REELS}×${GAME_CONFIG.ROWS} 盤面`);
    console.log(`💰 下注範圍: ${GAME_CONFIG.MIN_BET}-${GAME_CONFIG.MAX_BET}`);
    console.log(`🎯 符號數量: ${GAME_CONFIG.SYMBOLS.length}個`);
});

module.exports = app; 