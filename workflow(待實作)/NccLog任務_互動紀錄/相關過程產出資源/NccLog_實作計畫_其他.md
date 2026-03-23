# NccLog「其他」類別實作計畫

## Context

NccLog 需求的第 4 類別「其他」，包含 3 個 track_action：`viewlistSearch`、`viewsearchResult`、`inputQuery`。前三類別皆已完成，此為最後一個類別。

## 確認後的規格

| 事件 | 適用頁面 | RC | 說明 |
|------|---------|-----|------|
| `viewlistSearch` | 僅 AISearchRecommendResumeList | `11031010` | 進頁面取得履歷後觸發一次 |
| `viewsearchResult` | 僅 AiResumeList | `11031010` | 每頁載入觸發（含首頁 + 滾動分頁） |
| `inputQuery` | 僅 AiResumeList | `11031010` | `onSubmit` → `forceLoadFirstResumePage` 成功後，garId 有值時觸發 |

---

## 步驟 1：新增列舉值

### 1-1. AiResumeRc.js (L13-18)
**檔案**：`com/104/vip/rms/v3/core/lib/nccLog/AiResumeRc.js`

新增 `Page: '11031010'`

### 1-2. TrackAction.js (L126-127 之後)
**檔案**：`com/104/vip/rms/v3/core/lib/nccLog/TrackAction.js`

新增：
```js
/**
 * AI 履歷列表曝光與查詢
 */
ViewListSearch: 'viewlistSearch',
ViewSearchResult: 'viewsearchResult',
InputQuery: 'inputQuery'
```

---

## 步驟 2：AiResumeListManager — viewsearchResult

**檔案**：`com/104/vip/rms/v3/core/views/aiResumeList/managers/AiResumeListManager.js`

### 2-1. 新增 `sendExposureNccLog` 方法

放在 `sendFeedbackNccLog` (L2310) 附近，沿用相同 pattern：

```js
sendExposureNccLog ({ trackAction, ext = {} }) {
  try {
    window.nccLogService.pushLog({
      track: [trackAction],
      ext: {
        rc: AiResumeRc.Page,
        Gar_id: this.state.aiResumeList.garId,
        pr: this.state.aiResumeList.pr,
        jobno: this.state.aiResumeList.jobNo,
        input: this.state.aiResumeList.query,
        ...ext
      }
    })
  } catch (error) {
    console.error('send ncc log error', error)
  }
}
```

需 import `AiResumeRc`。

### 2-2. forceLoadFirstResumePage (L1856-1881) — 首頁載入

在 `.then()` 回調中，`return resumePage` (L1880) 之前插入：

```js
// viewsearchResult — 首頁載入
this.sendExposureNccLog({
  trackAction: TrackAction.ViewSearchResult,
  ext: {
    viewPage: this.paginationManager.current,
    id_no: resumePage.resumes.map(r => r.idNo).join(','),
    pddscore: resumePage.resumes.map(r => r.pddScore).join(',')
  }
})
```

> `viewPage` 使用 `this.paginationManager.current`，與 `ResumePageManager.forceLoadFirstResumePage` 帶入 API 的 page 參數一致。

### forceLoadFirstResumePage 呼叫節點盤點

| # | 位置 | 呼叫者 | 觸發情境 | viewsearchResult |
|---|------|-------|---------|-----------------|
| 1 | `AIResumeList.vue` L593 | `setup()` / `onMounted` | 首次進入頁面 | 送 |
| 2 | `AIResumeList.vue` L524 | `beforeRouteUpdate` | 路由變更（從 AIInput 送出查詢導航過來） | 送 |
| 3 | `AiResumeListManager.js` L821 | `onSubmit` | 頁面內直接送出查詢 | 送 |
| 4 | `AiResumeListManager.js` L869 | `onPrevPageClick` | 點擊上一頁回到第一頁 | 送 |

以上 4 個節點都會經過 `forceLoadFirstResumePage` 的 `.then()`，統一在此發送 viewsearchResult。

### 2-3. onLoadNextResumePage (L896-916) — 分頁載入

在 `.then(function (resumePage) {...})` (L900) 回調中，在既有邏輯之後加入：

```js
// viewsearchResult — 分頁載入
this.sendExposureNccLog({
  trackAction: TrackAction.ViewSearchResult,
  ext: {
    viewPage: resumePage.page,
    id_no: resumePage.resumes.map(r => r.idNo).join(','),
    pddscore: resumePage.resumes.map(r => r.pddScore).join(',')
  }
})
```

---

## 步驟 3：AiResumeListManager — inputQuery

**檔案**：`com/104/vip/rms/v3/core/views/aiResumeList/managers/AiResumeListManager.js`

### 觸發位置：onSubmit (L814-831)

在 `onSubmit` 的 `forceLoadFirstResumePage` chain 中，`.catch()` 之前插入 `.then()`：

```js
onSubmit (event, { jobNo, query }) {
  this.actions.updateJobNo(jobNo)
  this.actions.updateQuery(query)

  this.actions.updateIsAiRecommendResumes(false)
  this.component.$refs.aiResumeSearch.updateIsAiSearching(true)

  this.forceLoadFirstResumePage({
    updateDateType: this.resumeUpdatePanelManager.toCondition(),
    lastActionDateType: this.lastActionDatePanelManager.toCondition(),
    contactPrivacy: this.contactPrivacyPanelManager.toCondition(),
    jobNo,
    query
  })
    .then(function () {                                    // ← 新增
      if (this.state.aiResumeList.garId) {                 // ← garId 有值才送
        this.sendExposureNccLog({
          trackAction: TrackAction.InputQuery
        })
      }
    }.bind(this))                                          // ← 新增結束
    .catch(this.resumeLoadingErrorProxy.catch)
    .finally(function () {
      this.component.$refs.aiResumeSearch.updateIsAiSearching(false)
    }.bind(this))
}
```

### 執行順序說明

1. `onSubmit` → `this.forceLoadFirstResumePage()`
2. 內部 `ResumePageManager.forceLoadFirstResumePage` 的 `.then()` → L118 `updateGarId` 寫入 state
3. `AiResumeListManager.forceLoadFirstResumePage` 的 `.then()` → viewsearchResult 發送
4. 回到 `onSubmit` chain 的 `.then()` → 判斷 garId 有值後發送 inputQuery
5. API 失敗時 `.then()` 不執行，不會誤送

> `.then()` 必須在 `.catch()` 之前，否則 `.catch()` 會將 rejected promise 轉為 resolved，導致 API 失敗時 inputQuery 仍被觸發。

---

## 步驟 4：AiSearchRecommendResumeListManager — viewlistSearch

**檔案**：`com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/AiSearchRecommendResumeListManager.js`

### 4-1. 新增 `sendExposureNccLog` 方法

放在 `sendFeedbackNccLog` (L1202) 附近：

```js
sendExposureNccLog ({ trackAction, ext = {} }) {
  try {
    window.nccLogService.pushLog({
      track: [trackAction],
      ext: {
        rc: AiResumeRc.Page,
        pr: '',
        Gar_id: '',
        input: '',
        ...ext
      }
    })
  } catch (error) {
    console.error('send ncc log error', error)
  }
}
```

> AI 智慧查詢頁沒有 garId/pr/input，統一帶空字串。

需 import `AiResumeRc`。

### 4-2. forceLoadResumePage (L932-950) — 履歷載入後

在 `.then()` 回調中，`return resumePageList` (L949) 之前插入：

```js
// viewlistSearch — 履歷列表曝光
if (this.resumeSearchStatus === ResumeSearchStatus.HasResult) {
  const allResumes = resumePageList.flatMap(page => page.resumes)
  this.sendExposureNccLog({
    trackAction: TrackAction.ViewListSearch,
    ext: {
      id_no: allResumes.map(r => r.idNo).join(','),
      pddscore: allResumes.map(r => r.pddScore).join(','),
      jobno: resumePageList.map(page => page.jobNo).filter(Boolean).join(',')
    }
  })
}
```

> 用 `ResumeSearchStatus.HasResult` 條件守護，確保只在有結果時才送。

---

## 步驟 5：Import 更新

| 檔案 | 需新增 import |
|------|--------------|
| AiResumeListManager.js | `AiResumeRc`（若尚未有） |
| AiSearchRecommendResumeListManager.js | `AiResumeRc`（若尚未有） |

TrackAction 兩個檔案都已有 import。

---

## 需修改的檔案清單

| # | 檔案 | 修改內容 |
|---|------|---------|
| 1 | `com/104/vip/rms/v3/core/lib/nccLog/AiResumeRc.js` | 新增 `Page: '11031010'` |
| 2 | `com/104/vip/rms/v3/core/lib/nccLog/TrackAction.js` | 新增 3 個 TrackAction |
| 3 | `com/104/vip/rms/v3/core/views/aiResumeList/managers/AiResumeListManager.js` | 新增 `sendExposureNccLog`、首頁+分頁 viewsearchResult、onSubmit 中 inputQuery |
| 4 | `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/AiSearchRecommendResumeListManager.js` | 新增 `sendExposureNccLog`、viewlistSearch |

---

## 驗證方式

1. 開啟 DevTools Console，filter `ncc`
2. **viewsearchResult**：進入 AI 查詢結果列表頁 → 首頁載入送一筆（viewPage=paginationManager.current）→ 向下滾動載入第二頁送第二筆（viewPage=2）
3. **inputQuery**：在 AI 查詢結果列表頁面內送出自然語言查詢 → API 成功且 garId 有值時送出 inputQuery，ext 含 Gar_id/pr/jobno/input
4. **viewlistSearch**：進入 AI 智慧查詢頁 → 載入履歷後送出一筆，ext 中 pr/Gar_id/input 為空字串
