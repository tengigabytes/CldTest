# CLAUDE.md

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Repository Overview

**Repository:** `tengigabytes/MokyaLora_EMU`
**Live site:** https://tengigabytes.github.io/MokyaLora_EMU/
**Description:** MokyaLora Rev A 硬體模擬器 — 在瀏覽器中完整模擬 MokyaLora 手持 LoRa 裝置的外觀、鍵盤與輸入法行為。

## Repository Structure

```
MokyaLora_EMU/
├── README.md               — 專案說明
├── CLAUDE.md               — 此檔案
├── mokya-twin/             — 模擬器主體（GitHub Pages 部署此資料夾）
│   ├── index.html
│   ├── sw.js               — Service Worker（cache v5，自動更新機制）
│   ├── css/device.css      — PCB 外框、鍵盤、動畫
│   ├── js/app.js           — 啟動、鍵盤格建置、CSS zoom 縮放
│   ├── js/hal/             — display-hal.js / keyboard-hal.js / mie-hal.js
│   ├── js/core/            — MIE 注音引擎（processor / timer / trie）
│   ├── js/ui/              — renderer.js / screen-manager.js / screens/
│   └── js/serial/          — meshtastic-serial.js（Web Serial API）
└── MokyaLora/              — 硬體設計（原理圖、韌體、文件）
```

## Tech Stack

- **Language:** Vanilla JavaScript (ES2022 modules), HTML5, CSS3
- **Build system:** None — 直接以原始碼部署
- **Canvas renderer:** `<canvas>` 2D API，LVGL 風格繪圖函式
- **Display:** 320×240 landscape（ILI9341 等效），CSS zoom 縮放至頁面寬度
- **Keyboard:** 36 鍵 6×6 GPIO 矩陣模擬，multi-tap 注音輸入
- **PWA:** Service Worker + manifest，離線可用，部署後自動更新
- **Deployment:** GitHub Pages（`mokya-twin/` 資料夾）

## How to Run Locally

```bash
# ES modules + Service Worker 需要 HTTP 伺服器（不支援 file://）
npx serve mokya-twin
# 或
python3 -m http.server -d mokya-twin 8080
# 開啟 Chrome: http://localhost:8080
```

## Key Implementation Details

### Keyboard matrix (`js/hal/keyboard-hal.js`)
- `KEY_MATRIX`: 36 個鍵的完整定義（idx / row / col / label / label2 / label3 / fn / chars）
- `label` = 注音符號，`label2` = QWERTY/數字，`label3` = 計算機符號
- `multiTapWindowMs = 300`：多按確認視窗（純清理用，事件已即時觸發）
- `_registerTap`：每次 keyup 立即發出 `key:tap`，多按在視窗內累計 tapCount

### Device scaling (`js/app.js`)
- `scaleDevice()` 使用 `element.style.zoom` 將裝置放大至頁面寬度
- 在 `boot()` 末尾與 `window.resize` 時呼叫

### Canvas resolution (`js/hal/display-hal.js`)
- `WIDTH = 320, HEIGHT = 240`（橫向 landscape）

### Service Worker (`sw.js`)
- `index.html` 使用 **network-first**（確保部署後立即看到新版本）
- 其他本地資源使用 **cache-first**
- `skipWaiting()` + `clients.claim()` 確保新 SW 立即接管
- `index.html` 監聽 `controllerchange` 事件自動 reload

## Git Workflow

### Branch Naming

AI-generated feature branches follow the convention:

```
claude/<short-description>-<random-suffix>
```

Example: `claude/add-claude-documentation-CtwyZ`

### Commit Signing

Commits are signed using SSH keys. Do not bypass signing with `--no-gpg-sign` or similar flags.

### Push Convention

Always push with the upstream tracking flag:

```bash
git push -u origin <branch-name>
```

If a push fails due to a transient network error, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s). Do not retry on permanent errors (authentication, permissions).

**Note:** If the git proxy returns 503 on push (can occur after repo rename), use `mcp__github__push_files` with `repo: CldTest` as a fallback — GitHub redirects to the renamed repo.

### Branch Scope

- Direct pushes to `main` are allowed
- Do not create a pull request unless the user explicitly requests one

## GitHub Interactions

All GitHub interactions (issues, PRs, comments, file contents) must go through the MCP GitHub tools (`mcp__github__*`). Do not use `gh` CLI or direct API calls.

Repository scope is restricted to `tengigabytes/MokyaLora_EMU`. Do not interact with other repositories.

## General AI Assistant Guidelines

- Read files before modifying them
- Prefer editing existing files over creating new ones
- Do not add features, refactors, or cleanup beyond what was explicitly requested
- Do not add comments or docstrings to code you did not change
- Avoid introducing security vulnerabilities (injection, XSS, insecure defaults)
- Do not add error handling for scenarios that cannot occur
- Do not add backwards-compatibility shims or unused exports
- Keep changes minimal and scoped to the task at hand
- Confirm with the user before destructive or irreversible git operations (force push, reset --hard, branch deletion)
- Confirm before actions visible to others (pushing, opening PRs, posting comments)

## Updating This File

Keep this file current as the project evolves. Update it when:
- A new layer or module is added
- Key implementation details change (resolution, timing, cache version)
- New conventions are established
- The project purpose changes significantly
