# 聯絡錯誤處理比對：v3 (toBcEventErrorFields) vs vip25 (toCollectErrorModalProps)

## 情境比對總表

| Error Code | 情境 | v3 Title | vip25 Title | v3 彈窗內容 | vip25 彈窗內容 | v3 Detail 處理 | vip25 Detail 處理 | v3 onClose | vip25 onClose |
|-----------|------|----------|-------------|------------|---------------|---------------|------------------|-----------|--------------|
| `00211` | 履歷已關閉 | "履歷已關閉" | "履歷已關閉" | `{姓名}` + "以上送出失敗，求職者履歷已關閉" | `{姓名}` + "以上送出失敗，求職者履歷已關閉" | `innerJoinByIdNo` 比對 receivers | `getFailedReceiverContentsByIdNo` 比對 receivers | `reload()` | `reload()` |
| `00212` | 履歷已刪除 | "履歷已刪除" | "履歷已刪除" | `{姓名}` + "以上送出失敗，求職者履歷已刪除" | `{姓名}` + "以上送出失敗，求職者履歷已刪除" | `innerJoinBySnapshotId` 比對 receivers | `getFailedReceiverContentsBySnapshotId` 比對 receivers | `reload()` | `reload()` |
| `00101` | 超過每日接觸上限 | "超過每日可接觸上限" | "超過每日可接觸上限" | "每日可接觸上限履歷 {viewLimit} 筆, 您已接觸 {viewLimit} 筆" | `getOverViewErrorMessages` 產生的訊息 + "以上送出失敗" | 直接解構 `detail.viewLimit` | `getOverViewErrorMessages` 處理 | `undefined` | `undefined` |
| `00305` | 聯絡成功但未加入甄試流程 | "聯絡成功，但人選未加入甄試流程(含行事曆)" | "聯絡成功，但人選未加入甄試流程(含行事曆)" | "請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。" | "請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。" | 不使用 | `() => []` 不使用 | `null` | `undefined` |
| `00310` | ATS 履歷空間已達上限 | "聯絡成功，但人選無法加入甄試流程" | "聯絡成功，但人選無法加入甄試流程" | "甄試流程履歷空間已達上限，建議您先將不需要的履歷刪除後重新將人選加入流程。" | "甄試流程履歷空間已達上限，建議您先將不需要的履歷刪除後重新將人選加入流程。" | 不使用 | `() => []` 不使用 | `null` | `undefined` |
| `00311` | ATS 部分開放履歷不可加入 | "聯絡成功，但部分開放履歷無法加到甄試流程" | "聯絡成功，但部分開放履歷無法加到甄試流程" | "人選並未全部開放履歷資料，因此無法加入到甄試流程，仍可在聯絡訊息中查看已發送的訊息。" | "人選並未全部開放履歷資料，因此無法加入到甄試流程，仍可在聯絡訊息中查看已發送的訊息。" | 不使用 | `() => []` 不使用 | `null` | `undefined` |
| `10000` | 自訂批次錯誤碼 | — (無此 code 處理，走 default) | fallback "提醒您" | `error.message` | `{姓名}` + "以上送出失敗" | 走 default `() => []` | `getFailedReceiverContentsByIdNo` | `null` | `undefined` |
| 其他 | 未列舉的 code | "提醒您" | fallback "提醒您" | `error.message` | `error.message`（若 message 為 undefined → `[undefined]`） | 不使用 | `() => []` 不使用 | `null` | `undefined` |

## 行為差異摘要

| 比較維度 | v3 (`toBcEventErrorFields`) | vip25 (`toCollectErrorModalProps`) | 差異程度 |
|---------|---------------------------|-----------------------------------|---------|
| **title — 已知 code** | 一致 | 一致 | 無差異 |
| **title — 未知 code** | 明確寫死 `"提醒您"` | `BC_COMM_ERROR_TITLE[code]` 為 `undefined` → `getErrorModalProps` 內 fallback `"提醒您"` | 結果一致，路徑不同 |
| **彈窗內容 — 已知 code** | 一致 | 一致 | 無差異 |
| **彈窗內容 — 未知 code** | 顯示 `error.message` | 顯示 `error.message`，但若 `message` 為 `undefined` 則內容為 `[undefined]` | vip25 少一層防護 |
| **自訂批次錯誤碼 `10000`** | 走 default，顯示 `error.message` | 有獨立處理，用 `idNo` 比對姓名 + "以上送出失敗" | **有差異** |
| **onClose — 履歷關閉/刪除** | `reload()` | `reload()` | 無差異 |
| **onClose — 其他 code** | `null` | `undefined` | 型別不同，語意相同 |
| **多筆錯誤 title** | `"提醒您"` | `"提醒您"` (via `BC_COMM_ERROR_TITLE.MULTI`) | 無差異 |
| **多筆錯誤 onClose 判斷** | 直接檢查原始 errors 的 code 是否含 `00211`/`00212` | 取 errorFields 中第一個 truthy 的 onClose | 邏輯不同，結果一致 |

## 錯誤前處理（聚合策略）比對

| 比較維度 | v3 (`mergeAllFailedError`) | vip25 (`formatErrorCodeMapError`) |
|---------|--------------------------|----------------------------------|
| 聚合方式 | `groupBy(code)` → 依 code 用不同策略 reduce | `reduce` 依 code 聚合為 `{ [code]: error }` |
| `00211`/`00212` detail 合併 | `mergeRightWithConcatDetail` — concat detail 陣列 | concat detail 陣列 |
| `00101` detail 合併 | `mergeRightLimitError` — 取 `viewNow` 最小值 | `getMixinMethod(code)` 處理 |
| 其他 code 合併 | `mergeAll` (ramda) — 淺層合併，後者覆蓋 | 走 default mixin |
| 適用位置 | 意願邀約、面試邀約（詢問到職未使用） | 統一使用 |

## 潛在風險比對

| 風險 | v3 是否存在 | vip25 是否存在 | 說明 |
|------|-----------|--------------|------|
| errors/errorData 為 `undefined` | 低風險 — 來自 `flatten` 結果，必為陣列 | **高風險** — 若 catch 收到非預期結構（網路斷線等），`undefined.map()` 拋 TypeError | vip25 缺少防護 |
| errors 為空陣列 `[]` | `errorFields[0].title` 拋 TypeError，但上游有 `isEmpty` 守衛 | props 為 truthy 物件 → 開啟空白彈窗，但上游有 `if (props)` 判斷仍通過 | 兩邊皆有風險但上游守衛可阻擋 |
| `00101` detail 結構不符預期 | `detail.viewLimit` 解構失敗 → TypeError | `getOverViewErrorMessages` 行為取決於實作 | 兩邊皆有風險 |
| 詢問到職重複 errorField | 存在 — 未經 `mergeAllFailedError` | 不適用（vip25 統一經過聚合） | v3 獨有風險 |
| `onClose` null vs undefined | `setCloseModalCallback(null)` 行為取決於 modal 實作 | 統一為 `undefined` | v3 需確認 modal 對 null 的處理 |

## 結論

兩套實作在**已知 error code 的使用者體驗上完全一致**（title、內容、reload 行為）。主要差異在於：

1. **`10000` 自訂批次錯誤碼**：vip25 有獨立處理（列出失敗姓名），v3 走 default 只顯示 message
2. **防禦性**：v3 的 errors 來源較穩定（flatten 保證陣列），vip25 的 catch 解構缺少 `errorData` 為 undefined 的防護
3. **onClose 型別**：v3 用 `null`，vip25 用 `undefined`，語意相同但嚴格比較時不同
