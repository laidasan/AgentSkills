# useContactApi Catch #3 深度分析：`contactApi()` 失敗時的完整流程

> 檔案路徑：`vip25/utils/resumeListModule/index.ts` L1436-1453

## 資料流路徑

```
contactApi 失敗
  → resumeInviteHelper.ts 的 batchContactWith 判斷 responseStore 為空
    → formatErrorCodeMapError(errorStore) 將多筆 error 依 code 聚合
    → Promise.reject({ errors, errorData })
      → useContactApi catch 解構 { errors, errorData }
        → toCollectErrorModalProps(state)(errorData)
          → 對每筆 errorData 呼叫 getErrorModalProps
            → getFailedDetailsAdapter(code) 取得 detail adapter
            → getErrorFixedContent(code) 取得固定文案
            → BC_COMM_ERROR_TITLE[code] 取得 title
```

## 依 error code 分類的情境表

| 情境 | Error Code | Title (彈窗標題) | Detail 處理策略 | 固定文案 (fixedContent) | 關閉彈窗行為 |
|------|-----------|-----------------|----------------|----------------------|-------------|
| 履歷已關閉 | `00211` | "履歷已關閉" | `getFailedReceiverContentsByIdNo` — 用 idNo 比對 receivers 列出失敗的收件者姓名 | "以上送出失敗，求職者履歷已關閉" | `window.location.reload()` |
| 履歷已刪除 | `00212` | "履歷已刪除" | `getFailedReceiverContentsBySnapshotId` — 用 snapshotId 比對 receivers 列出失敗的收件者姓名 | "以上送出失敗，求職者履歷已刪除" | `window.location.reload()` |
| 超過每日接觸上限 | `00101` | "超過每日可接觸上限" | `getOverViewErrorMessages` — 特殊的超額提示訊息 | "以上送出失敗" | `undefined` (無特殊行為) |
| 聯絡成功但未加入甄試流程 | `00305` | "聯絡成功，但人選未加入甄試流程(含行事曆)" | `() => []` (無 detail) | "請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。" | `undefined` |
| ATS 履歷空間已達上限 | `00310` | "聯絡成功，但人選無法加入甄試流程" | `() => []` (無 detail) | "甄試流程履歷空間已達上限，建議您先將不需要的履歷刪除後重新將人選加入流程。" | `undefined` |
| ATS 部分開放履歷不可加入 | `00311` | "聯絡成功，但部分開放履歷無法加到甄試流程" | `() => []` (無 detail) | "人選並未全部開放履歷資料，因此無法加入到甄試流程，仍可在聯絡訊息中查看已發送的訊息。" | `undefined` |
| 自訂批次錯誤碼 | `10000` | **`undefined`** → fallback 為 "提醒您" | `getFailedReceiverContentsByIdNo` | "以上送出失敗" | `undefined` |
| **其他所有未列舉的 code** | 任意 | **`undefined`** → fallback 為 "提醒您" | `() => []` (空陣列) | `""` (空字串) | `undefined` |

## 多筆錯誤的情況

當 `errorData` 含多筆不同 code 的錯誤時（例如同時有 `00211` + `00101`），`toCollectErrorModalProps` 會：

- title 被覆蓋為 `"提醒您"` (`BC_COMM_ERROR_TITLE.MULTI`)
- `descriptionList` 被 `flatten` 合併所有錯誤的內容
- `onClose` 取第一個非 falsy 的值（所以只要包含履歷關閉/刪除，就會觸發 reload）

## 潛在風險

| 風險 | 說明 |
|------|------|
| `errorData` 為 `undefined` | 若 catch 收到的不是 `{ errors, errorData }` 結構（例如網路斷線、timeout），`errorData` 為 `undefined`，`failed.map(...)` 會直接 **拋出 TypeError**，這個錯誤不會被任何 catch 接住，變成 unhandled rejection |
| `errorData` 為空陣列 `[]` | `errorModalPropList` 為空 → `titles` 為空 → `title` 為 `undefined` → `isMultiError` 為 false → 彈窗 title 為 `undefined`。但 `if (props)` 判斷：因為 props 是一個物件（truthy），所以**仍然會開啟一個內容幾乎空白的錯誤彈窗** |
| 未知 error code | 走 default 分支：detail 為空、fixedContent 為空字串、title fallback 為 "提醒您"。最終 `content` 為空 → 顯示 `message` 欄位作為彈窗內容。若 `message` 也是 undefined，彈窗內容會是 `[undefined]` |

## 相關檔案索引

| 檔案 | 說明 |
|------|------|
| `vip25/utils/resumeListModule/index.ts` L1333-1455 | `useContactApi` 主體 |
| `vip25/adapter/data/contactModal.ts` L625-681 | `getErrorModalProps` / `toCollectErrorModalProps` |
| `vip25/adapter/data/contactModal.ts` L579-619 | `getFailedDetailsAdapter` / `getErrorFixedContent` |
| `vip25/types/bcCommErrorCode.ts` | `BC_COMM_ERROR_CODE` / `BC_COMM_ERROR_TITLE` 定義 |
| `vip25/adapter/data/resumeInviteHelper.ts` L116-145 | `formatErrorCodeMapError` — 聚合錯誤 |
| `vip25/components/resumeTools/resumeInviteHelper.ts` L412-441 | `batchContactWith` 的 reject 結構組裝 |
| `vip25/apis/pages/common/types.ts` L125-142 | `CreateEventError` / `CreateResponseFailedData` 型別定義 |
