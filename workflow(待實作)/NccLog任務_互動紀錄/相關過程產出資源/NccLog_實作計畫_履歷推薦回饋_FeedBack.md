# NccLog 履歷推薦回饋 FeedBack 實作計畫

## Context

Excel 規格要求在「履歷推薦回饋」元件中實作 3 個 NccLog 事件：`clicklike`（讚）、`clickunlike`（倒讚/不喜歡原因）。目前 `ResumeFitFeedback.vue` 已有 `sendNccLog` 骨架但參數全空，且元件未從父層接收必要資料。

依據使用者確認的實作方向：
1. 傳入 `idNo`、`pddScore` 給 `ResumeFitFeedback.vue`
2. `ResumeFitFeedback` 事件 emit 出去並傳出 `idNo`、`pddScore`
3. 在兩個父頁面（AIResumeList、AISearchRecommendResumeList）實作發送 NccLog 的邏輯

## 資料可用性

| 欄位 | AIResumeList | AISearchRecommendResumeList |
|------|-------------|---------------------------|
| `pddScore` | `resumeCard.resume.pddScore`（AiResumeBO） | `resumeCard.resume.pddScore`（AiResumeBO） |
| `garId` | `state.aiResumeList.garId`（Vuex） | 空字串 |
| `pr` | `state.aiResumeList.pr`（Vuex） | 空字串 |
| `jobNo` | `state.aiResumeList.jobNo`（Vuex） | `resumePage.jobNo` |
| `idNo` | `resumeCard.resume.idNo` | `resumeCard.resume.idNo` |

## 實作步驟

### Step 1: 新增 TrackAction

**檔案:** `com/104/vip/rms/v3/core/lib/nccLog/TrackAction.js`

新增：
```js
// AI 履歷推薦回饋
ClickLike: 'clicklike',
ClickUnlike: 'clickunlike'
```

### Step 2: 新增 Unlike Reason 列舉

**新增檔案:** `com/104/vip/rms/v3/core/lib/nccLog/AiResumeUnlikeReason.js`

建立 reasonId（index-based 0~4）到規格定義（1~5）的映射：
```js
// 0 → 1=EXPERIENCE, 1 → 2=EDUCATION, 2 → 3=LOCATION, 3 → 4=SKILL, 4 → 5=OTHER
```

### Step 3: 修改 ResumeFitFeedback Container

**檔案:** `com/104/vip/rms/v3/core/views/aiResumeSearch/container/resumeFitFeedback/ResumeFitFeedback.vue`

改動：
1. **移除** `sendNccLog` 方法和元件內的 NccLog 發送邏輯
2. **新增 prop** `pddScore`（Number，default 0）
3. **修改** `onPositiveFeedback`：保留 feedback toggle 邏輯，emit 事件時帶出 `idNo`、`pddScore`
4. **修改** `onNegativeFeedback`：同上，emit 帶出 `idNo`、`pddScore`
5. **修改** `onReasonClick`：emit 帶出 `idNo`、`pddScore` 和 `reasonId`

Emit 格式（參數形式）：
- `$emit('positiveFeedback', event, this.idNo, this.pddScore)`
- `$emit('negativeFeedback', event, this.idNo, this.pddScore)`
- `$emit('reasonClick', event, this.idNo, this.pddScore, reasonId)`

### Step 4: 修改 AIResumeList 頁面

**檔案:** `com/104/vip/rms/v3/core/views/aiResumeList/AIResumeList.vue`

改動：
1. 傳入 `:id-no="resumeCard.resume.idNo"` props
2. 傳入 `:pdd-score="resumeCard.resume.pddScore"` props
3. 綁定事件到 `aiResumeListManager`：
   - `@positiveFeedback="aiResumeListManager.onPositiveFeedback(resumeCard)"`
   - `@negativeFeedback="aiResumeListManager.onNegativeFeedback(resumeCard)"`
   - `@reasonClick="aiResumeListManager.onReasonClick(resumeCard)"`

   注意：template 綁定使用 currying 方式（與 AISearchRecommendResumeList 一致），manager 方法簽名為 `onPositiveFeedback (resumeCard) { return (event, idNo, pddScore) => { ... } }`

**檔案:** `com/104/vip/rms/v3/core/views/aiResumeList/managers/AiResumeListManager.js`

新增方法：
- `onPositiveFeedback(resumeCard)(event, idNo, pddScore)` → sendNccLog `clicklike`
- `onNegativeFeedback(resumeCard)(event, idNo, pddScore)` → sendNccLog `clickunlike`
- `onReasonClick(resumeCard)(event, idNo, pddScore, reasonId)` → sendNccLog `clickunlike` + unlike reason

NccLog ext：
```js
{
  jobno: this.state.aiResumeList.jobNo,
  id_no: idNo,
  pr: this.state.aiResumeList.pr,
  pddscore: String(pddScore),
  Gar_id: this.state.aiResumeList.garId,
  Buserid: ...,
  custno: ...
}
```

此頁面需要自己的 `sendNccLog` 方法（與 ResumeModalsManager 的模式相同，使用 `window.nccLogService.pushLog`）。

### Step 5: 修改 AISearchRecommendResumeList 頁面

**檔案:** `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/AISearchRecommendResumeList.vue`

改動：
1. 補上 `:id-no="resumeCard.resume.idNo"` props（目前未傳）
2. 補上 `:pdd-score="resumeCard.resume.pddScore"` props
3. 事件綁定已有，確認 emit 參數格式對接

**檔案:** `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/AiSearchRecommendResumeListManager.js`

新增方法：
- `onPositiveFeedback(resumeCard)(event, idNo, pddScore)` → sendNccLog `clicklike`
- `onNegativeFeedback(resumeCard)(event, idNo, pddScore)` → sendNccLog `clickunlike`
- `onReasonClick(resumeCard)(event, idNo, pddScore, reasonId)` → sendNccLog `clickunlike` + unlike reason

NccLog ext（此頁面 garId、pr 帶空字串）：
```js
{
  jobno: resumeCard.jobNo,
  id_no: idNo,
  pr: '',
  pddscore: String(pddScore),
  Gar_id: '',
  Buserid: ...,
  custno: ...
}
```

此頁面也需要自己的 `sendNccLog` 方法。

## 修改檔案清單

| 檔案 | 動作 |
|------|------|
| `com/104/vip/rms/v3/core/lib/nccLog/TrackAction.js` | 新增 `ClickLike`、`ClickUnlike` |
| `com/104/vip/rms/v3/core/lib/nccLog/AiResumeUnlikeReason.js` | **新增**：reason index → spec code 映射 |
| `com/104/vip/rms/v3/core/views/aiResumeSearch/container/resumeFitFeedback/ResumeFitFeedback.vue` | 移除 sendNccLog，新增 pddScore prop，修改 emit 帶出 idNo、pddScore |
| `com/104/vip/rms/v3/core/views/aiResumeList/AIResumeList.vue` | 傳入 idNo、pddScore props，綁定 feedback 事件 |
| `com/104/vip/rms/v3/core/views/aiResumeList/managers/AiResumeListManager.js` | 新增 feedback handler + sendNccLog |
| `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/AISearchRecommendResumeList.vue` | 補傳 idNo、pddScore props |
| `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/AiSearchRecommendResumeListManager.js` | 新增 feedback handler + sendNccLog |

## 驗證方式

1. 在兩個頁面分別操作：點讚、倒讚、選擇不喜歡原因
2. 透過 Chrome DevTools Network 或 Console 攔截 `window.nccLogService.pushLog` 呼叫，確認：
   - `track` 陣列包含正確的 `clicklike` / `clickunlike`
   - `ext` 包含所有必要欄位（jobno、id_no、pr、pddscore、Gar_id、Buserid、custno）
   - AIResumeList 有 garId/pr 值；AISearchRecommendResumeList 為空字串
   - unlike reason 的 code 對應正確（1~5）
3. 確認 toggle 行為正常：再次點擊讚/倒讚可取消，取消時不送 NccLog
