# 其他 — NccLog 分析

## Excel 規格整理

此類別有 **3 個事件**：

| trigger | track_action | 行為 | ext |
|---------|-------------|------|-----|
| 職缺履歷列表曝光時觸發（每次載入都會觸發） | `viewlistSearch` | 看履歷列表 | rc |
| 履歷列表曝光時觸發（每頁載入都會觸發） | `viewsearchResult` | 看履歷列表 | viewPage: 頁數, rc |
| 點擊自然語言搜尋介面「送出按鈕」，拿到 GAR 回傳內容時 | `inputQuery` | 輸入自然語言查詢內容 | rc |

## 目前代碼狀態

**三個 track_action 在整個代碼庫中完全不存在，尚未實作。**

---

## 1. viewlistSearch — 職缺履歷列表曝光

### 觸發時機

根據文件說明，分別在兩個頁面的**履歷資料載入後**觸發：

| 頁面 | 觸發位置 | 說明 |
|------|---------|------|
| AI 智慧查詢結果列表 (`AIResumeList.vue`) | `AiResumeListManager.forceLoadFirstResumePage()` 的 `.then()` 回調中 | 有無限滾動，分頁載入時也算曝光 |
| AI 智慧查詢 (`AISearchRecommendResumeList.vue`) | `AiSearchRecommendResumeListManager.forceLoadResumePage()` 的 `.then()` 回調中 | 只取一次資料，進頁面取得履歷後即曝光 |

### 需帶的 ext 資料

| ext 欄位 | 說明 | 資料來源 | 目前狀態 |
|----------|------|---------|---------|
| `rc` | — | 需定義（Excel 未指定具體 RC 值） | **未實作** |
| `input` | 自然語言查詢內容 | AI 查詢結果列表：Vuex `state.aiResumeList.query`；AI 智慧查詢：需確認 | **未傳入 sendNccLog** |
| `id_no` | 曝光履歷的 idno，多筆時逗號隔開 | `resumePageList` 中各 resume 的 `idNo` | **已有資料，但未組裝** |
| `device` | 裝置（web / mobileWeb） | `window.nccLogService` 內部處理 | 已有 |
| `pr` | PPERCENTILES | API metadata | **未存儲** |
| `pddscore` | 履歷餘弦相似度，多筆時逗號隔開 | API 每筆履歷 | **未存儲** |
| `Gar_id` | 該次查詢回傳的 GAR id | API metadata | **未存儲** |
| `jobno` | 該職缺 jobno | AI 查詢結果列表：`state.aiResumeList.jobNo`；AI 智慧查詢：`resumePage.jobNo` | 已有 |
| `Buserid` | 帳號 | `window.nccLogService.basicExt` | 已有 |
| `custno` | 客戶編號 | `window.nccLogService.basicExt` | 已有 |

### 建議發送位置

- **AI 查詢結果列表**：在 `ResumePageManager.forceLoadFirstResumePage()` (L93) 的 `.then()` 中，取得 `data` 和 `metadata` 後發送
- **AI 智慧查詢**：在 `AiSearchRecommendResumeListManager.forceLoadResumePage()` (L823) 的 `.then()` 中發送

---

## 2. viewsearchResult — 履歷列表每頁曝光

### 觸發時機

此事件**僅適用於 AI 查詢結果列表** (`AIResumeList.vue`)，因為只有此頁面有無限滾動分頁。

每次載入新一頁時觸發，包含：
- 首頁載入：`ResumePageManager.forceLoadFirstResumePage()`
- 後續分頁載入：`ResumePageManager.loadResumePage(page)` (L146)

**AI 智慧查詢頁面不適用**（只取一次資料，無分頁概念）。

### 需帶的 ext 資料

| ext 欄位 | 說明 | 資料來源 | 目前狀態 |
|----------|------|---------|---------|
| `viewPage` | 頁數 | `page` 參數（`loadResumePage(page)` 的參數） | **已有資料，但未組裝** |
| `rc` | — | 需定義 | **未實作** |
| `input` | 自然語言查詢內容 | Vuex `state.aiResumeList.query` | **未傳入 sendNccLog** |
| `id_no` | 曝光履歷的 idno，多筆時逗號隔開 | 該頁 `resumePage.resumes` 中各 resume 的 `idNo` | **已有資料，但未組裝** |
| `device` | 裝置 | `window.nccLogService` 內部處理 | 已有 |
| `pr` | PPERCENTILES | API metadata | **未存儲** |
| `pddscore` | 履歷餘弦相似度，多筆時逗號隔開 | API 每筆履歷 | **未存儲** |
| `Gar_id` | 該次查詢回傳的 GAR id | API metadata | **未存儲** |
| `jobno` | 該職缺 jobno | `state.aiResumeList.jobNo` | 已有 |
| `Buserid` | 帳號 | `window.nccLogService.basicExt` | 已有 |
| `custno` | 客戶編號 | `window.nccLogService.basicExt` | 已有 |

### 建議發送位置

- **首頁載入**：`ResumePageManager.forceLoadFirstResumePage()` 的 `.then()` 中
- **分頁載入**：`ResumePageManager.loadResumePage(page)` (L146) 的 `.then()` 中

---

## 3. inputQuery — 輸入自然語言查詢

### 觸發時機

根據文件說明：「點擊自然語言搜尋介面『送出按鈕』，拿到 GAR 回傳內容時」，即取得履歷資料時若後端回傳 `garId` 有值即觸發。

### 目前搜尋送出流程

1. 使用者在 `AIInput.vue` 點擊送出
2. `AIInput.onSubmit()` (L483) → `$router.push` 導頁至 AI 查詢結果列表
3. `AIResumeList.vue` 的 `beforeRouteUpdate` / `onMounted` 觸發
4. `AiResumeListManager.forceLoadFirstResumePage()` → `ResumePageManager.forceLoadFirstResumePage()` → 呼叫 API `/resume/nlp/search`
5. API 回傳 `metadata`（含 `garId`）

### 需帶的 ext 資料

| ext 欄位 | 說明 | 資料來源 | 目前狀態 |
|----------|------|---------|---------|
| `rc` | — | 需定義 | **未實作** |
| `input` | 自然語言查詢內容 | Vuex `state.aiResumeList.query` / API 請求的 `query` 參數 | **已有資料，但未組裝** |
| `Gar_id` | 該次查詢回傳的 GAR id | API `/resume/nlp/search` 回傳的 metadata | **未存儲**（`parseMetaData` 未解析） |
| `jobno` | 該職缺 jobno | `state.aiResumeList.jobNo` | 已有 |
| `Buserid` | 帳號 | `window.nccLogService.basicExt` | 已有 |
| `custno` | 客戶編號 | `window.nccLogService.basicExt` | 已有 |
| `device` | 裝置 | `window.nccLogService` 內部處理 | 已有 |

### 建議發送位置

在 `ResumePageManager.forceLoadFirstResumePage()` 的 `.then()` 中，當 `metadata` 回傳且 `garId` 有值時觸發。

---

## 關鍵發現（待補齊）

1. **三個 track_action 完全未實作**：`viewlistSearch`、`viewsearchResult`、`inputQuery` 在代碼中不存在
2. **GAR_id 未存儲**：API 回傳的 `garId` 沒有被 `parseMetaData` 解析和保存，這是三個事件共同的阻塞點
3. **pr、pddscore 未存儲**：同前面分析，API 回傳的這兩個欄位沒有被保留
4. **viewsearchResult 需要 viewPage**：此為額外欄位，在 `loadResumePage(page)` 中 page 已有，但需組裝進 ext
5. **inputQuery 觸發條件**：文件提到「若後端回傳 garId 有值即觸發」，需在 API 回傳後判斷 garId 是否有值
6. **Excel 未指定具體 RC 值**：`viewlistSearch`、`viewsearchResult`、`inputQuery` 三個事件的 RC 在「此次新增RC」sheet 中未找到對應值，需確認是否不需要 RC 或待補

## viewlistSearch 與 viewsearchResult 的差異

| 項目 | viewlistSearch | viewsearchResult |
|------|---------------|-----------------|
| 觸發範圍 | 兩個頁面都觸發 | 僅 AI 查詢結果列表（有分頁） |
| 觸發時機 | 每次載入履歷列表 | 每頁載入時 |
| 額外欄位 | 無 | `viewPage`（頁數） |
| AI 智慧查詢頁 | 進頁面取得資料後觸發一次 | 不適用 |
| AI 查詢結果列表 | 首次載入觸發 | 首次載入 + 每次滾動載入新頁都觸發 |

## 相關代碼位置

| 檔案 | 說明 |
|------|------|
| `com/104/vip/rms/v3/core/views/aiResumeList/managers/ResumePageManager.js` | AI 查詢結果列表的 `forceLoadFirstResumePage()` (L79) 和 `loadResumePage()` (L146)——viewlistSearch、viewsearchResult 的建議發送位置 |
| `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/AiSearchRecommendResumeListManager.js` | AI 智慧查詢的 `forceLoadResumePage()` (L817)——viewlistSearch 的建議發送位置 |
| `com/104/vip/rms/v3/core/views/aiResumeSearch/container/aiInput/AIInput.vue` | 搜尋送出元件 `onSubmit()` (L483)——inputQuery 的使用者觸發入口（但實際發送應在 API 回傳後） |
| `com/104/vip/rms/v3/core/adapter/aiResumeList/index.js` | `parseMetaData`——需補齊 `garId`、`pr` 的解析 |
| `com/104/vip/rms/v3/core/views/aiResumeList/store/state.js` | Vuex State，含 `query`、`jobNo` |
