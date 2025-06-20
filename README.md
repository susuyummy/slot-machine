# 🎰 後端拉霸機遊戲

一個使用Node.js後端運算的拉霸機遊戲，前端負責UI顯示，後端負責所有遊戲邏輯。

## 🚀 特色功能

- **後端運算**：所有遊戲邏輯由Node.js後端處理
- **用戶會話管理**：每個用戶有獨立的遊戲狀態
- **RESTful API**：標準的HTTP API接口
- **前端動畫**：保持原有的視覺效果和動畫
- **5×3盤面**：5個轉輪，每個3行符號
- **5條賠付線**：3條水平線 + 2條對角線
- **leftmost連線**：只有從最左側開始的連續3個以上相同符號才中獎

## 📋 系統需求

- Node.js 14.0.0 或更高版本
- npm 或 yarn

## 🛠️ 安裝與運行

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動後端服務器

```bash
# 開發模式（自動重啟）
npm run dev

# 生產模式
npm start
```

### 3. 訪問遊戲

打開瀏覽器訪問：http://localhost:3000

## 📁 文件結構

```
拉霸機/
├── server.js              # 後端服務器
├── package.json           # 項目配置
├── script-frontend.js     # 前端JavaScript
├── index-backend.html     # 後端版本HTML
├── index.html             # 原始前端版本HTML
├── script.js              # 原始前端版本JavaScript
├── style.css              # 樣式文件
├── README.md              # 說明文件
└── 圖片文件/
    ├── IMG_1538.JPG
    ├── CD978DF5-874B-4B32-8F1F-45C6F1829101_1_105_c.jpeg
    ├── C3644DE6-C8C9-4670-BF6F-7C29A7DED3AF_1_102_o.jpeg
    ├── A3DA6D9E-0EAF-417B-8A37-97C6EE7B9441_1_102_o.jpeg
    ├── 71052E39-0FE6-476E-8F06-338760888F7B_1_102_o.jpeg
    └── IMG_1385.JPG
```

## 🔌 API接口

### 獲取用戶會話
```
GET /api/session/:userId
```

### 轉動拉霸機
```
POST /api/spin
Content-Type: application/json

{
  "userId": "user_123",
  "betAmount": 10
}
```

### 獲取遊戲配置
```
GET /api/config
```

### 重置用戶會話
```
POST /api/reset/:userId
```

## 🎮 遊戲規則

1. **賠付線**：5條賠付線（3排橫線 + 2條對角線）
2. **中獎條件**：從最左側第一輪開始，連續3個以上相同符號
3. **重要**：中間斷掉後面又出現不算中獎
4. **獎金計算**：賠付倍數 × 下注金額
5. **下注範圍**：1-500

## 🎯 符號與賠付

| 符號 | 3連 | 4連 | 5連 | 備註 |
|------|-----|-----|-----|------|
| 🐰 | ×500 | ×1500 | ×3000 | 超級獎勵 |
| 🎯 | ×400 | ×1200 | ×4000 | 圖片5 |
| ✨ | ×250 | ×750 | ×2500 | 圖片4 |
| 🌟 | ×200 | ×600 | ×2000 | 圖片3 |
| 🖼️ | ×150 | ×450 | ×1500 | 圖片2 |
| 🎨 | ×100 | ×300 | ×1000 | 圖片1 |

## 🔧 開發說明

### 後端架構

- **Express.js**：Web框架
- **CORS**：跨域支持
- **用戶會話管理**：內存中的用戶狀態管理
- **遊戲邏輯**：完整的拉霸機算法

### 前端架構

- **API客戶端**：與後端通信
- **狀態管理**：本地遊戲狀態
- **DOM管理**：UI更新和動畫
- **事件處理**：用戶交互

### 部署選項

1. **本地開發**：`npm run dev`
2. **生產部署**：`npm start`
3. **Docker部署**：可添加Dockerfile
4. **雲端部署**：支持Heroku、Vercel等平台

## 🐛 故障排除

### 常見問題

1. **端口被佔用**
   ```bash
   # 修改server.js中的PORT變數
   const PORT = process.env.PORT || 3001;
   ```

2. **CORS錯誤**
   ```javascript
   // 在server.js中配置CORS
   app.use(cors({
     origin: 'http://localhost:3000'
   }));
   ```

3. **圖片載入失敗**
   - 確保圖片文件存在於正確路徑
   - 檢查文件權限

## 📝 版本歷史

- **v1.0.0**：初始版本，純前端實現
- **v2.0.0**：後端運算版本，Node.js + Express

## 🤝 貢獻

歡迎提交Issue和Pull Request！

## 📄 授權

MIT License 