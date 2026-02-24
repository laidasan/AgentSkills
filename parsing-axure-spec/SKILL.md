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

### Step 1｜執行截圖腳本

執行以下指令，腳本會引導使用者輸入密碼並選擇頁面：

```bash
NODE_PATH=$(npm root -g) node ./crawler.cjs [axure網址]
```

腳本執行完成後會輸出：
- 截圖儲存路徑（`output/{hostname}/{YYYY-MM-DD}/screenshots/`）
- 已截圖的頁面清單與對應檔名

若腳本回報 Playwright 未安裝，引導使用者執行 Prerequisites 的安裝指令後重試。

### Step 2｜分析截圖，產出 Markdown

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
