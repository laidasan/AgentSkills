# 聯絡錯誤處理 — Detail 處理結果逐項比對

> 此文件針對每個 error code，模擬實際資料推導 `descriptionList[].content` 的最終輸出，精確比對 v3 與 vip25 的差異。

## 共同前提

假設測試資料：

```js
receivers = [
  { idNo: '1001', snapshotId: 'snap-A', name: '王小明' },
  { idNo: '1002', snapshotId: 'snap-B', name: '李小華' }
]
```

---

## `00211` — 履歷已關閉

假設 `detail = [{ idNo: '1001' }]`，`candidates = [{ idNo: '1001' }]`

### v3 (`toClosedResumeErrorField`)

```js
// detail = [{ idNo: '1001' }]
failedReceiversNames = getFailedReceiversNamesByIdNo(receivers)(detail)
// innerJoin by idNo → [{ idNo: '1001', name: '王小明' }] → join('、') → "王小明"

content: ["王小明", "以上送出失敗，求職者履歷已關閉"]
```

### vip25 (`getErrorModalProps`)

```js
// detail = [{ idNo: '1001' }], isEmpty(detail) = false → details = [{ idNo: '1001' }]
detailContents = getFailedReceiverContentsByIdNo({ receivers, details: [{ idNo: '1001' }], candidates })
// details.map → find receiver by idNo → ['王小明'] → join('、') → "王小明"
// return ["王小明"]

fixedContent = "以上送出失敗，求職者履歷已關閉"
content = [...["王小明"], "以上送出失敗，求職者履歷已關閉"].filter(truthy)
       = ["王小明", "以上送出失敗，求職者履歷已關閉"]
```

### 比對結果

| 項目 | v3 | vip25 | 是否相同 |
|------|-----|-------|---------|
| content | `["王小明", "以上送出失敗，求職者履歷已關閉"]` | `["王小明", "以上送出失敗，求職者履歷已關閉"]` | 相同 |

---

## `00212` — 履歷已刪除

假設 `detail = [{ snapshotId: 'snap-A' }]`，`candidates = [{ snapshotId: 'snap-A' }]`

### v3 (`toDeletedResumeErrorField`)

```js
failedReceiversNames = getFailedReceiversNamesBySnapshotId(receivers)(detail)
// innerJoin by snapshotId → "王小明"

content: ["王小明", "以上送出失敗，求職者履歷已刪除"]
```

### vip25 (`getErrorModalProps`)

```js
detailContents = getFailedReceiverContentsBySnapshotId({ receivers, details: [{ snapshotId: 'snap-A' }], candidates })
// → ["王小明"]

fixedContent = "以上送出失敗，求職者履歷已刪除"
content = ["王小明", "以上送出失敗，求職者履歷已刪除"]
```

### 比對結果

| 項目 | v3 | vip25 | 是否相同 |
|------|-----|-------|---------|
| content | `["王小明", "以上送出失敗，求職者履歷已刪除"]` | `["王小明", "以上送出失敗，求職者履歷已刪除"]` | 相同 |

---

## `00101` — 超過每日接觸上限

假設 `detail = { viewLimit: '100', viewNow: '98', detail: '已超過每日上限' }`，`candidates = [{ idNo: '1001' }, { idNo: '1002' }]`

### v3 (`toOverViewErrorField`)

```js
// 只解構 viewLimit
const { detail: { viewLimit } } = error  // viewLimit = '100'

content: ["每日可接觸上限履歷 100 筆, 您已接觸 100 筆"]
```

> 注意：v3 用 `viewLimit` 同時填入「上限」和「已接觸」，**這是一個 bug 或簡化** — 實際已接觸數應為 `viewNow`。

### vip25 (`getOverViewErrorMessages`)

```js
// details = { viewLimit: '100', viewNow: '98', detail: '已超過每日上限' }
const { viewLimit, viewNow, detail } = details
// viewLimit = '100', viewNow = '98'

candidatesName = candidates
  .map(c => receivers.find(r => r.idNo === `${c.idNo}`))
  .filter(truthy).map(c => c.name).join('、')
// → "王小明、李小華"

viewRemain = 100 - 98 = 2
isRemain = true  // 2 > 0
cancelCheckedQuality = 2 - 2 = 0

// isRemain 為 true 的分支：
return [
  "今日尚可瀏覽 2 位求職者，",
  "請取消勾選 0 筆履歷，以符合每日履歷查詢上限。",
  "王小明、李小華"
]

fixedContent = "以上送出失敗"
content = [
  "今日尚可瀏覽 2 位求職者，",
  "請取消勾選 0 筆履歷，以符合每日履歷查詢上限。",
  "王小明、李小華",
  "以上送出失敗"
]
```

若 `viewNow >= viewLimit`（例如 viewNow = '100'）：

```js
viewRemain = 0, isRemain = false
// isRemain 為 false 的分支：
return [detail, candidatesName]  // ["已超過每日上限", "王小明、李小華"]

content = ["已超過每日上限", "王小明、李小華", "以上送出失敗"]
```

### 比對結果

| 項目 | v3 | vip25 (尚有餘額) | vip25 (無餘額) | 是否相同 |
|------|-----|-----------------|---------------|---------|
| content | `["每日可接觸上限履歷 100 筆, 您已接觸 100 筆"]` | `["今日尚可瀏覽 2 位求職者，", "請取消勾選 0 筆履歷，以符合每日履歷查詢上限。", "王小明、李小華", "以上送出失敗"]` | `["已超過每日上限", "王小明、李小華", "以上送出失敗"]` | **不同** |
| 是否列出失敗者姓名 | 否 | 是 | 是 | **不同** |
| 是否區分餘額情境 | 否（固定文案） | 是（兩種分支） | 是 | **不同** |
| 是否正確顯示已接觸數 | 否（用 viewLimit 代替） | 是（用 viewNow 計算） | 是 | **不同** |

---

## `00305` — 聯絡成功但未加入甄試流程

### v3 (`toSyncScheduleErrorField`)

```js
content: ["請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。"]
```

### vip25 (`getErrorModalProps`)

```js
detailContents = getFailedDetailsAdapter('00305')  // → () => []
// detailContents = []

fixedContent = "請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。"
content = [...[], "請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。"].filter(truthy)
       = ["請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。"]
```

### 比對結果

| 項目 | v3 | vip25 | 是否相同 |
|------|-----|-------|---------|
| content | `["請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。"]` | `["請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。"]` | 相同 |

---

## `00310` — ATS 履歷空間已達上限

### v3 (`toExceedMaxCandidateErrorField`)

```js
content: ["甄試流程履歷空間已達上限，建議您先將不需要的履歷刪除後重新將人選加入流程。"]
```

### vip25 (`getErrorModalProps`)

```js
detailContents = []  // default adapter
fixedContent = "甄試流程履歷空間已達上限，建議您先將不需要的履歷刪除後重新將人選加入流程。"
content = ["甄試流程履歷空間已達上限，建議您先將不需要的履歷刪除後重新將人選加入流程。"]
```

### 比對結果

| 項目 | v3 | vip25 | 是否相同 |
|------|-----|-------|---------|
| content | `["甄試流程履歷空間已達上限，建議您先將不需要的履歷刪除後重新將人選加入流程。"]` | `["甄試流程履歷空間已達上限，建議您先將不需要的履歷刪除後重新將人選加入流程。"]` | 相同 |

---

## `00311` — ATS 部分開放履歷不可加入

### v3 (`toSemiOnErrorField`)

```js
content: ["人選並未全部開放履歷資料，因此無法加入到甄試流程，仍可在聯絡訊息中查看已發送的訊息。"]
```

### vip25 (`getErrorModalProps`)

```js
detailContents = []  // default adapter
fixedContent = "人選並未全部開放履歷資料，因此無法加入到甄試流程，仍可在聯絡訊息中查看已發送的訊息。"
content = ["人選並未全部開放履歷資料，因此無法加入到甄試流程，仍可在聯絡訊息中查看已發送的訊息。"]
```

### 比對結果

| 項目 | v3 | vip25 | 是否相同 |
|------|-----|-------|---------|
| content | `["人選並未全部開放履歷資料，因此無法加入到甄試流程，仍可在聯絡訊息中查看已發送的訊息。"]` | `["人選並未全部開放履歷資料，因此無法加入到甄試流程，仍可在聯絡訊息中查看已發送的訊息。"]` | 相同 |

---

## `10000` — 自訂批次錯誤碼

假設 `detail = [{ idNo: '1001' }]`，`candidates = [{ idNo: '1001' }]`，`message = "部分聯絡失敗"`

### v3 (`toOtherErrorField` — 走 default)

```js
// 10000 不在 switch 中，走 default → toOtherErrorField
content: ["部分聯絡失敗"]   // 只顯示 error.message
```

### vip25 (`getErrorModalProps`)

```js
// getFailedDetailsAdapter('10000') 命中 BC_COMM_CUSTOM_ERROR_CODE → getFailedReceiverContentsByIdNo
detailContents = getFailedReceiverContentsByIdNo({ receivers, details: [{ idNo: '1001' }], candidates })
// → ["王小明"]

fixedContent = getErrorFixedContent('10000')  // 命中 BC_COMM_CUSTOM_ERROR_CODE → "以上送出失敗"
content = ["王小明", "以上送出失敗"]
```

### 比對結果

| 項目 | v3 | vip25 | 是否相同 |
|------|-----|-------|---------|
| content | `["部分聯絡失敗"]` | `["王小明", "以上送出失敗"]` | **不同** |
| 是否列出失敗者姓名 | 否 | 是 | **不同** |
| 固定文案 | 使用 error.message 原文 | "以上送出失敗" | **不同** |

---

## 其他未列舉的 code

假設 `code = '99999'`，`message = "未知錯誤"`，`detail = {}`

### v3 (`toOtherErrorField`)

```js
content: ["未知錯誤"]
```

### vip25 (`getErrorModalProps`)

```js
detailContents = getFailedDetailsAdapter('99999')  // default → () => []
// detailContents = []

fixedContent = getErrorFixedContent('99999')  // default → ""
content = [...[], ""].filter(truthy)  // "" 被 filter 掉
       = []

hasContent = false
// fallback 到 message
content = [message] = ["未知錯誤"]
```

### 比對結果

| 項目 | v3 | vip25 | 是否相同 |
|------|-----|-------|---------|
| content | `["未知錯誤"]` | `["未知錯誤"]` | 相同 |

若 `message` 為 `undefined`：

| 項目 | v3 | vip25 | 是否相同 |
|------|-----|-------|---------|
| content | `[undefined]` | `[undefined]` | 相同（皆有問題） |

---

## 總結比對表

| Error Code | 情境 | v3 content 輸出 | vip25 content 輸出 | 結果是否相同 | 差異說明 |
|-----------|------|----------------|-------------------|------------|---------|
| `00211` | 履歷已關閉 | `["{姓名}", "以上送出失敗，求職者履歷已關閉"]` | `["{姓名}", "以上送出失敗，求職者履歷已關閉"]` | 相同 | — |
| `00212` | 履歷已刪除 | `["{姓名}", "以上送出失敗，求職者履歷已刪除"]` | `["{姓名}", "以上送出失敗，求職者履歷已刪除"]` | 相同 | — |
| `00101` | 超過每日接觸上限 | `["每日可接觸上限履歷 {viewLimit} 筆, 您已接觸 {viewLimit} 筆"]` | 尚有餘額：`["今日尚可瀏覽 N 位求職者，", "請取消勾選 M 筆履歷...", "{姓名}", "以上送出失敗"]`；無餘額：`["{detail文案}", "{姓名}", "以上送出失敗"]` | **不同** | vip25 更精細：區分餘額情境、列出失敗者姓名、使用 viewNow 計算；v3 僅用 viewLimit 顯示固定文案 |
| `00305` | 未加入甄試流程 | `["請稍後再試..."]` | `["請稍後再試..."]` | 相同 | — |
| `00310` | ATS 空間已達上限 | `["甄試流程履歷空間已達上限..."]` | `["甄試流程履歷空間已達上限..."]` | 相同 | — |
| `00311` | 部分開放履歷不可加入 | `["人選並未全部開放..."]` | `["人選並未全部開放..."]` | 相同 | — |
| `10000` | 自訂批次錯誤碼 | `[error.message]` | `["{姓名}", "以上送出失敗"]` | **不同** | vip25 有獨立 adapter 列出失敗者姓名；v3 走 default 只顯示 message |
| 其他 | 未知 code | `[error.message]` | `[error.message]` | 相同 | — |
