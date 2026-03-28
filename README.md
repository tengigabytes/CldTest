# MokyaLora EMU

**MokyaLora Rev A 硬體模擬器** — 在瀏覽器中完整模擬 MokyaLora 手持裝置的外觀與操作介面。

🔗 **Live Demo:** https://tengigabytes.github.io/MokyaLora_EMU/

---

## 簡介

MokyaLora EMU 是 [MokyaLora](https://github.com/tengigabytes/MokyaLora) 硬體的數位孿生（Digital Twin）。
目標是在瀏覽器中 1:1 重現 Rev A PCB 的外觀、鍵盤佈局與輸入行為，供韌體開發、UI 設計與使用者測試使用。

**模擬硬體規格：**

| 項目 | 規格 |
|------|------|
| MCU | RP2350 (雙核 Cortex-M33) |
| 螢幕 | ILI9341 320×240 橫向 TFT |
| 鍵盤 | 6×6 GPIO 矩陣，36 鍵 |
| 輸入法 | MIE (Multi-tap Input Engine) — 注音 / 英文 / 數字 |
| 無線 | LoRa + Meshtastic 協定 |
| 連接 | USB-C (Web Serial API) |

---

## 功能

- **PCB 外觀** — FR4 深綠色電路板、黃色絲印邊框、左側天線短截頭
- **鍵盤矩陣** — 完整 5×5 核心輸入區 + 導航區，標示注音 / QWERTY / 計算機符號三層標籤
- **MIE 注音輸入** — 多按循環 (multi-tap) 輸入注音符號，候選字即時顯示
- **三個畫面** — 聊天室、地圖、系統設定（底部 Tab 列切換）
- **Web Serial** — 可連接真實 MokyaLora 裝置收發 Meshtastic 訊息
- **PWA** — 可安裝、離線運作，自動更新（部署後無需手動清快取）
- **桌面鍵盤** — 支援實體鍵盤操作（開發用）

---

## 本機執行

```bash
# 需要 HTTP 伺服器（ES modules + Service Worker 不支援 file://）
npx serve mokya-twin
# 或
python3 -m http.server -d mokya-twin 8080
```

開啟瀏覽器：`http://localhost:8080`

> **建議使用 Chrome 110+**（完整支援 Web Serial API 與 PWA）

---

## 目錄結構

```
MokyaLora_EMU/
├── README.md
├── CLAUDE.md                   # AI 助手工作指引
├── mokya-twin/                 # 模擬器主體（GitHub Pages 部署此資料夾）
│   ├── index.html              # PWA 入口
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker（離線快取 + 自動更新）
│   ├── ROADMAP.md              # 開發路線圖（Phase 1–5）
│   ├── css/device.css          # 裝置外框、鍵盤、動畫樣式
│   ├── data/zhuyin-mock.json   # MIE mock 字典
│   ├── js/
│   │   ├── app.js              # 啟動程序、鍵盤格建置、縮放
│   │   ├── hal/                # display-hal / keyboard-hal / mie-hal
│   │   ├── core/               # mie-processor / mie-timer / mie-trie
│   │   ├── ui/                 # renderer / screen-manager / screens
│   │   └── serial/             # meshtastic-serial (Web Serial API)
│   └── wasm/                   # Phase 4：編譯後的 WASM 二進位
└── MokyaLora/                  # 硬體設計資料（原理圖、韌體、文件）
```

---

## 開發路線圖

| Phase | 內容 | 狀態 |
|-------|------|------|
| 1 | 裝置模擬、鍵盤、HAL 抽象層、畫面框架 | ✅ 完成 |
| 2 | MIE 完整注音組字、候選詞選擇、完整字典 | 🔄 進行中 |
| 3 | Meshtastic protobuf 編解碼、真實 USB 連線 | ⏳ 待開發 |
| 4 | WASM Bridge — 以編譯後 C 程式碼取代 JS 實作 | ⏳ 待開發 |
| 5 | 多裝置模擬、GNSS 回放、人因測試套件 | ⏳ 待開發 |

詳見 [`mokya-twin/ROADMAP.md`](mokya-twin/ROADMAP.md)

---

## 部署

此倉庫使用 **GitHub Pages**，自動從 `main` 分支的 `mokya-twin/` 資料夾部署。

Service Worker 自動更新：部署後開啟網頁即可看到最新版本，無需手動清快取。

---

## 授權

硬體設計：[CERN-OHL-S-2.0](MokyaLora/LICENSE-CERN-OHL-S-2.0.txt)  
文件：[CC-BY-SA-4.0](MokyaLora/LICENSE-CC-BY-SA-4.0.txt)  
模擬器程式碼（`mokya-twin/`）：MIT
