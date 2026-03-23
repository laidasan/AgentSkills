# toBcEventErrorFields 深度分析

> 檔案路徑：`com/104/vip/rms/v3/core/adapter/bcContactErrorsModal/bcContactErrorsModal.js`

## 使用位置

`toBcEventErrorFields` 在 `ResumeModalsManager.js` 中有 **3 處呼叫**，皆用於聯絡 API 回應後處理錯誤：

| # | 行號 | 聯絡類型 | 錯誤來源 |
|---|------|---------|---------|
| 1 | L987 | 意願邀約 (willingness) | 批次聯絡 — `responseFailed` + `errorDataList` 經 `mergeAllFailedError` 聚合 |
| 2 | L1204 | 面試邀約 (interview) | 批次聯絡 — `responseFailed` + `errorDataList` 經 `mergeAllFailedError` 聚合 |
| 3 | L1403 | 詢問到職 (inquire) | 單次聯絡 — 直接取 `response.data.failed`，**未經** `mergeAllFailedError` |

## 資料流路徑

```
批次聯絡 (意願邀約 / 面試邀約):
  results
    → responses (成功) → responseFailed = response.data.failed
    → errors (失敗)   → errorDataList  = error.response.data
    → flatten([responseFailed, errorDataList])
      → mergeAllFailedError: groupBy(code) → 依 code 用不同策略合併
        → toBcEventErrorFields({ receivers, errors: allFailedErrors })

單次聯絡 (詢問到職):
  response.data.failed
    → toBcEventErrorFields({ receivers, errors: responseFailed })
```

## mergeAllFailedError 合併策略

在進入 `toBcEventErrorFields` 之前，相同 code 的錯誤會先被合併：

| Error Code | 合併策略 | 說明 |
|-----------|---------|------|
| `00211` (ClosedResume) | `mergeRightWithConcatDetail` | detail 陣列 concat，其餘取右值 |
| `00212` (DeletedResume) | `mergeRightWithConcatDetail` | 同上 |
| `00305` (SuccessButCanNotSyncSchedule) | `mergeRightWithConcatDetail` | 同上 |
| `00310` (AtsExceedMaxCandidateStorage) | `mergeRightWithConcatDetail` | 同上 |
| `00311` (AtsNotAllowedSemiOnResume) | `mergeRightWithConcatDetail` | 同上 |
| `00101` (OverBrowseLimit) | `mergeRightLimitError` | detail 取 `viewNow` 最小值的那筆 |
| 其他 | `mergeAll` (ramda) | 淺層合併，後者覆蓋前者 |

## toBcEventErrorFields 核心邏輯

```js
toErrorFields = ({ receivers, errors }) => {
  const errorFields = errors.map(error => toErrorField({ receivers, error }))
  // 判斷是否需要 reload
  const needReloadPage = any(either(
    propEq('code', ClosedResume),
    propEq('code', DeletedResume)
  ))(errors)
  // 多種錯誤類型時 title 改為「提醒您」
  const multipleErrorType = errorFields.length > 1
  const title = multipleErrorType ? '提醒您' : errorFields[0].title
  const descriptionList = flatten(map(prop('descriptionList'), errorFields))
  const onClose = needReloadPage ? () => window.location.reload() : undefined
  return { title, descriptionList, onClose }
}
```

## 依 error code 分類的情境表

| 情境 | Error Code | Adapter 函式 | Title (彈窗標題) | 彈窗內容 | Detail 比對方式 | 關閉彈窗行為 |
|------|-----------|-------------|-----------------|---------|---------------|-------------|
| 履歷已關閉 | `00211` | `toClosedResumeErrorField` | "履歷已關閉" | `{失敗者姓名}` + "以上送出失敗，求職者履歷已關閉" | 用 `idNo` innerJoin receivers 取得姓名 | `window.location.reload()` |
| 履歷已刪除 | `00212` | `toDeletedResumeErrorField` | "履歷已刪除" | `{失敗者姓名}` + "以上送出失敗，求職者履歷已刪除" | 用 `snapshotId` innerJoin receivers 取得姓名 | `window.location.reload()` |
| 超過每日接觸上限 | `00101` | `toOverViewErrorField` | "超過每日可接觸上限" | "每日可接觸上限履歷 {viewLimit} 筆, 您已接觸 {viewLimit} 筆" | 直接解構 `detail.viewLimit` | 無 (`undefined`) |
| 聯絡成功但未加入甄試流程 | `00305` | `toSyncScheduleErrorField` | "聯絡成功，但人選未加入甄試流程(含行事曆)" | "請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。" | 不使用 detail | `null` |
| ATS 履歷空間已達上限 | `00310` | `toExceedMaxCandidateErrorField` | "聯絡成功，但人選無法加入甄試流程" | "甄試流程履歷空間已達上限，建議您先將不需要的履歷刪除後重新將人選加入流程。" | 不使用 detail | `null` |
| ATS 部分開放履歷不可加入 | `00311` | `toSemiOnErrorField` | "聯絡成功，但部分開放履歷無法加到甄試流程" | "人選並未全部開放履歷資料，因此無法加入到甄試流程，仍可在聯絡訊息中查看已發送的訊息。" | 不使用 detail | `null` |
| **其他所有未列舉的 code** | 任意 | `toOtherErrorField` | "提醒您" | `error.message` 原始訊息 | 不使用 detail | `null` |

## 多筆不同 code 錯誤的情境

當 `errors` 陣列含有多種不同 code 時：

| 條件 | 行為 |
|------|------|
| `errorFields.length > 1` | title 統一為 `"提醒您"`，不再顯示個別錯誤標題 |
| `descriptionList` | 所有錯誤的 descriptionList 被 `flatten` 合併，依序顯示 |
| 包含 `00211` 或 `00212` | `onClose` 為 `window.location.reload()`（即使混合其他錯誤） |
| 不包含 `00211` 且不包含 `00212` | `onClose` 為 `undefined` |

## 與 vip25 版本 (toCollectErrorModalProps) 的差異比較

| 比較項目 | v3 (`toBcEventErrorFields`) | vip25 (`toCollectErrorModalProps`) |
|---------|---------------------------|-----------------------------------|
| 錯誤前處理 | `mergeAllFailedError` 依 code 聚合後傳入 | `formatErrorCodeMapError` 依 code 聚合後傳入 |
| 未知 code 的 title | 明確為 `"提醒您"` | `BC_COMM_ERROR_TITLE[code]` 為 `undefined` → fallback `"提醒您"` |
| 未知 code 的內容 | 顯示 `error.message` | 同樣 fallback 到 `message`，但若 message 為 undefined 會產生 `[undefined]` |
| onClose 判斷 | 直接檢查原始 errors 陣列的 code | 取 errorFields 中第一個 truthy 的 onClose |
| null vs undefined 的 onClose | 非 reload 情境回傳 `null` | 非 reload 情境回傳 `undefined` |
| errorData 為 undefined 防護 | errors 來自 `flatten` 結果，必為陣列 | **無防護**，`undefined.map()` 會拋 TypeError |

## 潛在風險

| 風險 | 說明 |
|------|------|
| `toOverViewErrorField` 解構 `detail.viewLimit` | 若 `detail` 為 `undefined` 或不含 `viewLimit`，會拋出 TypeError。在 `mergeRightLimitError` 策略中，`detail` 取 `minBy(prop('viewNow'))`，若 API 回傳的 detail 結構不含 `viewNow`，合併結果可能不如預期 |
| 詢問到職 (inquire) 未經 `mergeAllFailedError` | 若 API 回傳 `failed` 中有多筆相同 code 的錯誤，不會被聚合，`toBcEventErrorFields` 會產生多個重複的 errorField，彈窗內容會重複顯示 |
| `onClose` 為 `null` vs `undefined` | `setCloseModalCallback(onClose)` 接收到 `null` 時，行為取決於 modal 實作。若 modal 用 `if (onClose)` 判斷則 `null` 等同無 callback；若用 `if (onClose !== undefined)` 判斷則 `null` 會被當作有效值 |
| `errors` 為空陣列 | `errorFields` 為空 → `errorFields[0]` 為 `undefined` → `errorFields[0].title` 拋 TypeError。但上游有 `isEmpty(allFailedErrors)` 的守衛，正常流程不會進入此分支 |

## 相關檔案索引

| 檔案 | 說明 |
|------|------|
| `com/104/vip/rms/v3/core/adapter/bcContactErrorsModal/bcContactErrorsModal.js` | `toErrorField` / `toErrorFields` 主體 |
| `com/104/vip/rms/v3/core/lib/BcCommErrorCode.js` | Error Code 列舉定義 |
| `com/104/vip/rms/v3/core/lib/bcContactEvent/bcContactEvent.js` | `mergeAllFailedError` 及合併策略 |
| `com/104/vip/rms/v3/core/container/resumeFeatures/manager/ResumeModalsManager.js` L972-999, L1189-1216, L1388-1415 | 三處使用位置 |
