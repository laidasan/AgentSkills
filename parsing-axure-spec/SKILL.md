---
name: parsing-axure-spec
description: Captures screenshots of selected Axure prototype pages and converts each page into a Markdown spec document via vision analysis. Triggers when a user provides an Axure Share URL and requests spec extraction, e.g. "/parsing-axure https://xxxx.axshare.com/".
user-invocable: true
---

# Parsing Axure Spec

將 Axure 原型頁面截圖，並透過視覺分析轉換為 Markdown 規格文件。

## Prerequisites

執行前確認以下項目已安裝（一次性設定）：

```bash
# 1. 全域安裝 playwright
npm install -g playwright

# 2. 安裝 Chromium browser binary
npx playwright install chromium

# 3. 確認 Node.js >= 18
node -v
```

若 Node.js 版本不符，透過 nvm 切換：

```bash
source ~/.nvm/nvm.sh && nvm use 18
```

## Usage

```
/parsing-axure [axure網址]
```

## Workflow

### Step 1｜確認密碼

使用 AskUserQuestion 詢問使用者是否需要密碼：

- 若需要 → 請使用者提供密碼，帶入 `--password` 參數
- 若不需要 → `--password` 參數留空，腳本會自動跳過

### Step 2｜取得頁面清單

執行腳本的 `--list` 模式，輸出頁面清單 JSON：

```bash
source ~/.nvm/nvm.sh && nvm use 18 && NODE_PATH=$(npm root -g) node ./scripts/crawler.cjs [axure網址] --password [密碼] --list
```

解析輸出的 JSON，取得所有頁面名稱。

### Step 3｜讓使用者選擇頁面

根據頁面數量選擇互動方式：

- **頁面數 <= 4**：使用 AskUserQuestion（multiSelect: true）呈現選項，讓使用者勾選
- **頁面數 > 4**：以 Markdown 表格列出完整清單（含編號與頁面名稱），請使用者以文字回覆編號或名稱

> AskUserQuestion 的 options 上限為 4 個，頁面數超過時必須改用文字互動。

### Step 4｜執行截圖

將使用者選擇的頁面名稱以逗號串接，帶入 `--pages` 參數執行截圖：

```bash
source ~/.nvm/nvm.sh && nvm use 18 && NODE_PATH=$(npm root -g) node ./scripts/crawler.cjs [axure網址] --password [密碼] --pages "[頁面1,頁面2,...]"
```

腳本執行完成後會輸出：
- 截圖儲存路徑（`output/{hostname}/{YYYY-MM-DD}/screenshots/`）
- 已截圖的頁面清單與對應檔名

若腳本回報 Playwright 未安裝，引導使用者執行 Prerequisites 的安裝指令後重試。

### Step 5｜分析截圖，產出 Markdown

截圖完成後，對每一張截圖執行以下流程：

1. 使用 Read tool 讀取截圖檔案（PNG）
2. 描述畫面內容，涵蓋：
   - 頁面用途與功能說明
   - 介面元件（按鈕、表單、清單等）及其標籤文案
   - 互動說明（如有標注）
   - 排版結構與區塊層次
3. 將描述寫入對應的 Markdown 檔案

輸出路徑：`output/{hostname}/{YYYY-MM-DD}/markdown/{截圖同名}.md`

範例：截圖 `01_畫面示意與介面規則.png` → `01_畫面示意與介面規則.md`

所有頁面處理完成後，告知使用者輸出目錄位置。
