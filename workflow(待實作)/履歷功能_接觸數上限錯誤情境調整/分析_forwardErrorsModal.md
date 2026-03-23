# forwardErrorsModal 深度分析

> 檔案路徑：`com/104/vip/rms/v3/core/adapter/resume/forwardErrorsModal.js`

## 概述

此模組處理**轉寄履歷**功能的錯誤彈窗顯示。錯誤類型由 `ResumeToolsResponseType`（即 `ResumeToolsResponseStatus`）決定，而非 bc-comm 的 error code。

錯誤物件結構為：

```js
error = {
  type: ResumeToolsResponseStatus,    // 錯誤類型
  resumeToolType: ResumeToolType,     // 履歷工具類型（此處為 FORWARD）
  payload: {                          // 由 resumeToolErrorMessage 組裝
    modal: string,
    viewMax?: string,
    viewNow?: string,
    cancelCheckedQuantity?: string,
    failedName?: string,
    resumeErrStatus?: string,
    message?: string
  }
}
```

## 使用位置

| 檔案 | 行號 | 說明 |
|------|------|------|
| `ResumeModalsManager.js` | L1699 | 轉寄履歷失敗時，用 `toForwardEmailErrorField` 取得單筆錯誤的彈窗 props |

> 注意：使用的是 `toErrorField`（單筆），而非 `toErrorFields`（多筆）。

## 資料流路徑

```
轉寄履歷 API 回傳非成功
  → ResumeToolsErrorModalManager.convertToResumeToolError()
    → resumeToolsMessageHandler(resumeSource, resumeToolType, result, contentInfo, userName)
      → 依 result.status.type 決定 payload 內容
      → return { type, resumeToolType, payload }
  → toForwardEmailErrorField({ error })
    → getFieldAdapter(error.type) 取得對應 adapter
    → adapter 從 error.payload 取值組裝 { title, descriptionList, onClose }
  → 設定 errorListModalManager 的 title, descriptionList, onClose
  → 顯示錯誤彈窗
```

## 依 error type 分類的情境表

### `accessError` — 履歷已關閉/刪除（無法存取）

**上游組裝 payload（resumeToolsMessageHandler）：**

```js
// resumeSource 決定 resumeErrStatus
params.resumeErrStatus = (resumeSource === 'document' || resumeSource === 'apply')
  ? '刪除' : '關閉'

// userName 為 { id: name } 的對照表
params.failedName = errId.map(id => userName[id] || '').join(',')

payload = { modal: 'accessError', resumeErrStatus, failedName }
```

**adapter 處理（toResumeAccessErrorField）：**

```js
resumeStatus = error.payload.resumeErrStatus  // '關閉' 或 '刪除'
failedReceiversNames = error.payload.failedName  // '王小明,李小華'
```

| 項目 | 值 |
|------|-----|
| title | `"履歷已關閉"` 或 `"履歷已刪除"` |
| content | `["{failedName}", "以上送出失敗，求職者履歷已關閉"]` 或 `["{failedName}", "以上送出失敗，求職者履歷已刪除"]` |
| onClose | `window.location.reload()` |

> 注意：`failedName` 是以逗號 `,` 分隔，而非頓號 `、`。

---

### `pidNotActivate` — 求職者已關閉聯絡功能

**上游組裝 payload：**

```js
payload = { modal: 'pidNotActivate', failedName }
```

**adapter 處理（toPidNotActivateErrorField）：**

| 項目 | 值 |
|------|-----|
| title | `"已關閉聯絡功能"` |
| content | `["{failedName}", "求職者已關閉聯絡功能"]` |
| onClose | `undefined`（未設定） |

---

### `overView` — 超過每日接觸上限

**上游組裝 payload（resumeToolsMessageHandler）：**

```js
// 計算需取消勾選的數量
cancelCheckedQuantity = receiverQuantity - (viewMax - viewNow)

// 超額者姓名
failedName = params.viewOverNames.join(',')

payload = { modal: 'overView', viewMax, viewNow, cancelCheckedQuantity, failedName }
```

**adapter 處理（toOverViewErrorField）：**

```js
viewMax = error.payload.viewMax
viewNow = error.payload.viewNow
remainView = Math.max(viewMax - viewNow, 0)
```

**情境 A：尚有餘額**（remainView > 0）

| 項目 | 值 |
|------|-----|
| title | `"超過每日可接觸上限"` |
| content | `["今日尚可瀏覽 {remainView} 位求職者，已超過查詢上限，轉寄失敗。"]` |
| onClose | `undefined`（未設定） |

**情境 B：無餘額**（remainView = 0）

| 項目 | 值 |
|------|-----|
| title | `"超過每日可接觸上限"` |
| content | `["每日可接觸上限履歷 {viewMax} 筆, 您已接觸 {viewNow} 筆"]` |
| onClose | `undefined`（未設定） |

> 注意：與 `bcContactErrorsModal` 的 `toOverViewErrorField` 不同，此處**正確使用了 `viewNow`**，且區分了兩種餘額情境。但不會列出失敗者姓名（payload 中有 `failedName` 但 adapter 沒有使用）。

---

### `multiSrcSendFail` — 多筆送出失敗

**觸發條件：** `resumeSource === 'idSearch'` 且為 `ACCESS_ERROR` / `PID_NON_ACT` / `PARTIAL_FAIL` 時，type 會被轉換為 `multiSrcSendFail`。

**上游組裝 payload：**

```js
payload = { modal: 'multiSrcSendFail', failedName }
```

**adapter 處理（toMultiSrcSendFailErrorField）：**

| 項目 | 值 |
|------|-----|
| title | `"送出失敗"` |
| content | `["{failedName}", "以上送出失敗。"]` |
| onClose | `undefined`（未設定） |

---

### default — 其他錯誤（含 `accessDeny`、`unknownError` 等）

**上游組裝 payload：**

```js
// 若 message 為 string，直接使用
// 若 message 為 object，轉換為 "欄位名稱 + 錯誤訊息<br>" 格式
payload = { modal: 'other', message: MsgText }
```

**adapter 處理（toOtherErrorField）：**

| 項目 | 值 |
|------|-----|
| title | `"提醒您"` |
| content | `["{message}"]`（可能包含 `<br>` HTML） |
| onClose | `null` |

> 注意：`message` 可能含有 `<br>` 標籤（來自 object 型別的 message 轉換），若彈窗元件不支援 HTML 渲染，會顯示原始標籤文字。

---

## toErrorFields — 多筆錯誤彈窗

雖然 `ResumeModalsManager.js` 中只使用了 `toErrorField`（單筆），但模組也匯出了 `toErrorFields`（多筆）：

```js
toErrorFields = ({ receivers, errors }) => {
  const errorFields = errors.map(error => toErrorField({ receivers, error }))
  const needReloadPage = any(propEq('type', AccessError))(errors)
  const isMultipleErrorType = errorFields.length > 1
  const title = isMultipleErrorType ? '提醒您' : head(errorFields).title
  const descriptionList = flatten(map(prop('descriptionList'), errorFields))
  const onClose = needReloadPage ? () => window.location.reload() : undefined
  return { title, descriptionList, onClose }
}
```

| 條件 | 行為 |
|------|------|
| 多種錯誤類型 | title 統一為 `"提醒您"` |
| 包含 `accessError` | `onClose` 為 `reload()` |
| 不包含 `accessError` | `onClose` 為 `undefined` |

---

## 所有情境總覽

| Error Type | 情境 | Title | Content | onClose | 是否列出失敗者姓名 |
|-----------|------|-------|---------|---------|-----------------|
| `accessError` | 履歷已關閉 | `"履歷已關閉"` | `["{failedName}", "以上送出失敗，求職者履歷已關閉"]` | `reload()` | 是（逗號分隔） |
| `accessError` | 履歷已刪除 | `"履歷已刪除"` | `["{failedName}", "以上送出失敗，求職者履歷已刪除"]` | `reload()` | 是（逗號分隔） |
| `pidNotActivate` | 求職者已關閉聯絡功能 | `"已關閉聯絡功能"` | `["{failedName}", "求職者已關閉聯絡功能"]` | `undefined` | 是（逗號分隔） |
| `overView` (餘額 > 0) | 超過接觸上限（尚有餘額） | `"超過每日可接觸上限"` | `["今日尚可瀏覽 {remainView} 位求職者，已超過查詢上限，轉寄失敗。"]` | `undefined` | 否（adapter 未使用 failedName） |
| `overView` (餘額 = 0) | 超過接觸上限（無餘額） | `"超過每日可接觸上限"` | `["每日可接觸上限履歷 {viewMax} 筆, 您已接觸 {viewNow} 筆"]` | `undefined` | 否（adapter 未使用 failedName） |
| `multiSrcSendFail` | ID 搜尋多筆送出失敗 | `"送出失敗"` | `["{failedName}", "以上送出失敗。"]` | `undefined` | 是（逗號分隔） |
| default | 其他錯誤 | `"提醒您"` | `["{message}"]`（可能含 `<br>`） | `null` | 否 |

## 潛在風險

| 風險 | 說明 |
|------|------|
| `failedName` 以逗號分隔而非頓號 | 上游 `errId.map(id => userName[id]).join(',')` 用英文逗號 `,`，與 `bcContactErrorsModal` 的頓號 `、` 不一致，使用者體驗不同 |
| `overView` adapter 未使用 `failedName` | payload 中已包含 `failedName`，但 `toOverViewErrorField` 完全沒有讀取，失敗者姓名資訊被丟棄 |
| `overView` adapter 未使用 `cancelCheckedQuantity` | 上游在 `resumeToolsMessageHandler` 精心計算了 `cancelCheckedQuantity`，但 adapter 未使用，改用自己計算的 `remainView` |
| default 的 `message` 可能含 HTML | `resumeToolErrorMessage` 在 object message 轉換時插入 `<br>`，若彈窗元件用 `v-text` 或純文字渲染，使用者會看到原始 HTML 標籤 |
| `toErrorFields` 的 `head(errorFields).title` | 若 `errors` 為空陣列，`head` 回傳 `undefined` → `.title` 拋 TypeError。但目前實際使用的是 `toErrorField`（單筆），此風險僅在未來若改用 `toErrorFields` 時存在 |
| `payload` 可能為 `undefined` | `resumeToolsMessageHandler` 在 `unknownError` 且無 `sysError`/`validate` 時，`payload` 不會被賦值（為 `undefined`）。此時 `error.payload` 為 `undefined`，`pathOr` 會 fallback 為空字串 `''`，彈窗會顯示空白內容 |

## 相關檔案索引

| 檔案 | 說明 |
|------|------|
| `com/104/vip/rms/v3/core/adapter/resume/forwardErrorsModal.js` | 本模組主體 |
| `com/104/vip/rms/v3/core/lib/ResumeToolsResponseType.js` | 錯誤類型列舉 |
| `node_modules/104vip-f2e-common/src/utils/resume/resumeToolsErrorHelper.ts` | `resumeToolsMessageHandler` — 錯誤 payload 組裝邏輯 |
| `com/104/vip/rms/v3/core/container/resumeFeatures/manager/ResumeToolsErrorModalManager.js` | `convertToResumeToolError` — 呼叫 `resumeToolsMessageHandler` 的中介 |
| `com/104/vip/rms/v3/core/container/resumeFeatures/manager/ResumeModalsManager.js` L1699-1718 | 使用位置 |
