# 修正 OverView (00101) 錯誤彈窗 — 統一對齊舊版查詢履歷

## Context

三處 OverView 錯誤彈窗的顯示內容與舊版查詢履歷（vip25 `getOverViewErrorMessages`）不一致。主要差異：缺少失敗者姓名、未區分餘額情境、`viewNow` 數值錯誤。需修正為與舊版相同的輸出格式。

### 目標輸出格式（對齊 vip25 `getOverViewErrorMessages`）

**尚有餘額** (viewRemain > 0):
```js
content: [
  "今日尚可瀏覽 {viewRemain} 位求職者，",
  "請取消勾選 {cancelCheckedQuantity} 筆履歷，以符合每日履歷查詢上限。",
  "{failedNames}",       // 頓號分隔
  "以上送出失敗"
]
```

**無餘額** (viewRemain <= 0):
```js
content: [
  "{detail}",            // error 的 detail 文案
  "{failedNames}",       // 頓號分隔
  "以上送出失敗"
]
```

---

## 修正項目

### 1. bcContactErrorsModal.js — `toOverViewErrorField`

**檔案:** `com/104/vip/rms/v3/core/adapter/bcContactErrorsModal/bcContactErrorsModal.js` L59-69

**現況:**
```js
const toOverViewErrorField = ({ error }) => {
  const { detail: { viewLimit } } = error
  return {
    title: '超過每日可接觸上限',
    descriptionList: [{
      id: uuidv4(),
      content: [`每日可接觸上限履歷 ${viewLimit} 筆, 您已接觸 ${viewLimit} 筆`]
    }]
  }
}
```

**修正:**
- 解構 `receivers` 參數（`toErrorField` 已傳入）
- 從 `error.detail` 取 `viewLimit`、`viewNow`、`detail`
- 計算 `viewRemain` 和 `cancelCheckedQuantity`
- 用 `getFailedReceiversNamesByIdNo(receivers)(receivers)` 取得所有失敗者姓名（overView 情境代表整批失敗）
- 依餘額分支產生不同 content
- 加入 "以上送出失敗" 固定文案

---

### 2. saveResumesToFolder — OverView 情境

**檔案:** `com/104/vip/rms/v3/core/container/resumeFeatures/manager/ResumeModalsManager.js` L2545-2563

**現況:**
```js
savingResumeHttpErrorProxy.setOnBadRequest([AddingResumeToFolderErrorCode.OverView], (message, error) => {
  const details = pathOr([], ['response', 'data', 'details'], error)
  const viewMax = propOr('', 'max')(details)
  const viewNow = propOr('', 'used')(details)
  const remainView = Math.max(viewMax - viewNow, 0)
  const cancelCheckedQuantity = resumeIdNos.length - remainView

  this.errorListModalManager.title = this.t('saveResumeModal.errors.overView.title')
  this.errorListModalManager.descriptionList = [{
    id: uuidv4(),
    content: remainView > 0
      ? [this.t('saveResumeModal.errors.overView.hasRemainingDescription', { remainView, cancelCheckedQuantity })]
      : [this.t('saveResumeModal.errors.overView.noRemainingDescription', { viewMax, viewNow })]
  }]
  // ...
})
```

**修正:**
- 此情境所有 resumes 皆儲存失敗，用 `idNoResumes` + `snapshotIdResumes` 組合所有失敗者姓名（頓號分隔）
- 在 content 陣列中加入 failedNames 和 "以上送出失敗"
- 保留現有 i18n 文案，僅在後方追加姓名和固定文案

---

### 3. forwardErrorsModal.js — `toOverViewErrorField`

**檔案:** `com/104/vip/rms/v3/core/adapter/resume/forwardErrorsModal.js` L31-47

**現況:**
```js
const toOverViewErrorField = ({ error }) => {
  const { detail: { viewLimit } } = error
  // ...實際上 error 結構是 payload 格式
}
```

**注意:** 此處的 `error` 結構是 `resumeToolsMessageHandler` 轉換後的結果：
```js
error = {
  type: 'overView',
  payload: { modal, viewMax, viewNow, cancelCheckedQuantity, failedName }
}
```

**修正:**
- 從 `error.payload` 正確取得 `viewMax`、`viewNow`、`failedName`
- 計算 `remainView = Math.max(viewMax - viewNow, 0)`
- 將 `failedName`（逗號分隔）轉換為頓號分隔，以維持與舊版一致的視覺
- 依餘額分支產生不同 content
- 加入 "以上送出失敗" 固定文案

---

## 不修改的檔案

- `com/104/vip/rms/v3/core/lib/bcContactEvent/bcContactEvent.js` — mergeAllFailedError 邏輯不動
- `node_modules/104vip-f2e-common/src/utils/resume/resumeToolsErrorHelper.ts` — 外部套件不動
- `com/104/vip/rms/v3/resource/locales/zh_TW/common/saveResumeModal/index.js` — i18n 文案不動

## 驗證方式

1. 在 AI 智慧查詢頁面（意願邀約 / 面試邀約），觸發 00101 超過接觸上限錯誤，確認彈窗顯示：失敗者姓名（頓號分隔）+ 餘額資訊 + "以上送出失敗"
2. 儲存履歷功能觸發 OverView 錯誤，確認彈窗包含：失敗者姓名 + 餘額資訊 + "以上送出失敗"
3. 轉寄履歷功能觸發 OverView 錯誤，確認彈窗包含：失敗者姓名（頓號分隔）+ 餘額資訊 + "以上送出失敗"
4. 三處的輸出格式應與舊版查詢履歷 (`getOverViewErrorMessages`) 的結果一致
