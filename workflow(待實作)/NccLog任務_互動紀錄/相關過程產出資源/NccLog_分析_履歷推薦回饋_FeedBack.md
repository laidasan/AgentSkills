# 履歷推薦回饋 FeedBack — NccLog 分析

## Excel 規格整理

此功能有 **3 個觸發事件**（第 4 個「取消回饋」標記為編輯中，暫不列入）：

| trigger | track_action | 行為 | ext |
|---------|-------------|------|-----|
| 點擊「讚」時觸發 | `clicklike` | 喜歡推薦職缺 (單筆) | rc |
| 點擊「倒讚」時觸發 | `clickunlike` | 不喜歡推薦職缺 (單筆) | rc |
| 點擊「不喜歡原因」時觸發 | `clickunlike` | 不喜歡推薦職缺原因 (單筆) | rc |

### 各事件需帶的 ext 欄位

#### clicklike（讚）
| ext 欄位 | 說明 |
|----------|------|
| `jobno` | 該職缺 jobno |
| `id_no` | 回饋的 idno |
| `pr` | PPERCENTILES（向量搜尋會有，無則空字串） |
| `pddscore` | 履歷的餘弦相似度，多筆時逗號隔開（順序與 jobno 對應） |
| `Buserid` | 帳號 |
| `custno` | 客戶編號 |
| `device` | 裝置（web / mobileWeb） |
| `Gar_id` | 該次查詢回傳的 GAR id |

#### clickunlike（倒讚）
| ext 欄位 | 說明 |
|----------|------|
| `jobno` | 該職缺 jobno |
| `id_no` | 回饋的 idno |
| `pr` | PPERCENTILES（向量搜尋會有，無則空字串） |
| `pddscore` | 履歷的餘弦相似度，多筆時逗號隔開（順序與 idno 對應） |
| `Buserid` | 帳號 |
| `custno` | 客戶編號 |
| `device` | 裝置（web / mobileWeb） |
| `Gar_id` | 該次查詢回傳的 GAR id |

#### clickunlike（不喜歡原因）
| ext 欄位 | 說明 |
|----------|------|
| `jobno` | 該職缺 jobno |
| `id_no` | 回饋的 idno |
| `unlike` | 原因代碼：1=EXPERIENCE；2=EDUCATION；3=LOCATION；4=SKILL；5=OTHER |
| `pr` | PPERCENTILES（向量搜尋會有，無則空字串） |
| `pddscore` | 履歷的餘弦相似度，多筆時逗號隔開（順序與 idno 對應） |
| `Buserid` | 帳號 |
| `custno` | 客戶編號 |
| `device` | 裝置（web / mobileWeb） |
| `Gar_id` | 該次查詢回傳的 GAR id |

## 發送位置

NccLog 在 `ResumeFitFeedback.vue` **元件內部直接發送**，透過自身的 `sendNccLog()` 方法（L106-119），使用 `window.nccLogService.pushLog()`。

### 觸發方法

| 使用者操作 | 元件方法 | 目前 sendNccLog 狀態 |
|-----------|---------|---------------------|
| 點擊「讚」 | `onPositiveFeedback()` (L63) | **已呼叫 sendNccLog，但 trackAction 和 ext 皆為空**（`trackAction: ''`, `ext: {}`） |
| 點擊「倒讚」 | `onNegativeFeedback()` (L80) | **已呼叫 sendNccLog，但 trackAction 和 ext 皆為空** |
| 點擊不喜歡原因 | `onReasonClick()` (L96) | **尚未呼叫 sendNccLog**（只有 `// todo send ncclog` 註解） |

## 元件使用位置

`ResumeFitFeedback.vue` 在兩個頁面中使用：

### 1. AI 智慧查詢結果列表（`AIResumeList.vue` L275）
```html
<resume-fit-feedback />
```
- **未綁定任何事件**，feedback 邏輯完全在元件內部處理
- **未傳入 props**（`idNo` 使用預設空字串）

### 2. AI 智慧查詢（`AISearchRecommendResumeList.vue` L169-175）
```html
<resume-fit-feedback
  :active-feedback="resumeCard.activeFeedback"
  :active-reason-id="resumeCard.activeReasonId"
  @positiveFeedback="aiSearchRecommendResumeListManager.onPositiveFeedback(resumeCard)"
  @negativeFeedback="aiSearchRecommendResumeListManager.onNegativeFeedback(resumeCard)"
  @reasonClick="aiSearchRecommendResumeListManager.onReasonClick(resumeCard)"
/>
```
- 有傳入 `activeFeedback` 和 `activeReasonId` props
- 有綁定事件到 manager，**但 manager 中未找到 `onPositiveFeedback`、`onNegativeFeedback`、`onReasonClick` 的實作**

## 需要帶的 ext 資料

| ext 欄位 | 說明 | 資料來源 | 目前狀態 |
|----------|------|---------|---------|
| `jobno` | 該職缺 jobno | AI 查詢結果列表：Vuex State `state.aiResumeList.jobNo`；AI 智慧查詢：`resumePage.jobNo` | **未傳入元件** |
| `id_no` | 回饋的 idno | 元件 props `idNo` | **AI 查詢結果列表未傳入**；AI 智慧查詢未傳入 |
| `unlike` | 不喜歡原因代碼 | 元件內部 `reasonId`（需映射為 1~5） | **未實作映射**（目前 reason id 是 index-based 字串 `"0"`, `"1"`, ...，需對應到規格的 1=EXPERIENCE 等） |
| `pr` | PPERCENTILES | 需從 API metadata 取得 | **未存儲、未傳入元件** |
| `pddscore` | 履歷餘弦相似度 | 需從 API 每筆履歷取得 | **未存儲、未傳入元件** |
| `Buserid` | 帳號 | `window.nccLogService.basicExt` | 已有（元件 sendNccLog 已處理） |
| `custno` | 客戶編號 | `window.nccLogService.basicExt` | 已有（元件 sendNccLog 已處理） |
| `device` | 裝置 | `window.nccLogService` 內部處理 | 已有（nccLogService 自帶） |
| `Gar_id` | 該次查詢回傳的 GAR id | 需從 API metadata 取得 | **未存儲、未傳入元件** |

## 關鍵發現（待補齊）

1. **sendNccLog 已呼叫但參數全空**：`onPositiveFeedback` 和 `onNegativeFeedback` 中已呼叫 `sendNccLog`，但 `trackAction` 和 `ext` 都是空值，需填入正確的 `clicklike` / `clickunlike` 和對應的 ext 資料
2. **onReasonClick 未發送 NccLog**：只有 `// todo send ncclog` 註解，需實作
3. **元件缺少關鍵資料**：`jobno`、`pr`、`pddscore`、`Gar_id` 等資料目前都沒有傳入元件，需要從父層傳入
4. **unlike 原因映射未建立**：元件內的 `reasonId` 是 index-based（`"0"`, `"1"`, ...），需對應到規格定義的 `1=EXPERIENCE；2=EDUCATION；3=LOCATION；4=SKILL；5=OTHER`
5. **idNo 未正確傳入**：AI 查詢結果列表頁使用 `<resume-fit-feedback />` 時未傳入 `:id-no`
6. **AI 智慧查詢頁的 manager 事件未實作**：template 綁定了 `@positiveFeedback` 等到 manager，但 manager 中找不到這些方法的實作
7. **取消回饋（第 4 個事件）**：Excel 標記為「編輯中」，目前元件中點擊已按讚的讚會取消（toggle 行為），但未發送 NccLog

## 相關代碼位置

| 檔案 | 說明 |
|------|------|
| `com/104/vip/rms/v3/core/views/aiResumeSearch/container/resumeFitFeedback/ResumeFitFeedback.vue` | Feedback 容器元件，含 sendNccLog 邏輯（待補齊） |
| `com/104/vip/rms/v3/core/views/aiResumeSearch/components/resumeFitFeedback/ResumeFitFeedback.vue` | Feedback UI 元件（展示層） |
| `com/104/vip/rms/v3/core/lib/aiResumeSearch/FitFeedback.js` | FitFeedback 列舉（None: -1, Negative: 0, Positive: 1） |
| `com/104/vip/rms/v3/core/views/aiResumeList/AIResumeList.vue` L275 | AI 查詢結果列表頁使用處（未傳 props、未綁事件） |
| `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/AISearchRecommendResumeList.vue` L169 | AI 智慧查詢頁使用處（有綁事件但 manager 未實作） |
