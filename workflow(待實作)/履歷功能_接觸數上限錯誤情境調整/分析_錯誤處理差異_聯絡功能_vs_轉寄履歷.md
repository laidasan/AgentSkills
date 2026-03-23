# 錯誤處理差異 — 聯絡功能 (toBcEventErrorFields) vs 轉寄履歷 (forwardErrorsModal)

> 僅列出兩模組在**相同情境**下處理結果**不同**的項目，以及**僅存在於單一模組**的情境。

## 共同測試資料

```js
receivers = [
  { idNo: '1001', snapshotId: 'snap-A', name: '王小明' },
  { idNo: '1002', snapshotId: 'snap-B', name: '李小華' }
]
```

---

## 一、相同情境但處理結果不同

### 履歷已關閉（聯絡 `00211` / 轉寄 `accessError` + resumeErrStatus='關閉'）

假設失敗者為王小明、李小華

#### 聯絡功能 (`toClosedResumeErrorField`)

```js
// innerJoinByIdNo → join('、')
failedReceiversNames = "王小明、李小華"

content: ["王小明、李小華", "以上送出失敗，求職者履歷已關閉"]
```

#### 轉寄履歷 (`toResumeAccessErrorField`)

```js
// 上游 errId.map(id => userName[id]).join(',')
failedReceiversNames = "王小明,李小華"

content: ["王小明,李小華", "以上送出失敗，求職者履歷已關閉"]
```

#### 比對結果

| 項目 | 聯絡功能 | 轉寄履歷 | 是否相同 |
|------|---------|---------|---------|
| title | `"履歷已關閉"` | `"履歷已關閉"` | 相同 |
| content | `["王小明、李小華", "以上送出失敗，求職者履歷已關閉"]` | `["王小明,李小華", "以上送出失敗，求職者履歷已關閉"]` | **不同** — 姓名分隔符號：頓號 `、` vs 逗號 `,` |
| onClose | `reload()` | `reload()` | 相同 |

---

### 履歷已刪除（聯絡 `00212` / 轉寄 `accessError` + resumeErrStatus='刪除'）

假設失敗者為王小明

#### 聯絡功能 (`toDeletedResumeErrorField`)

```js
content: ["王小明", "以上送出失敗，求職者履歷已刪除"]
```

#### 轉寄履歷 (`toResumeAccessErrorField`)

```js
content: ["王小明", "以上送出失敗，求職者履歷已刪除"]
```

#### 比對結果

| 項目 | 聯絡功能 | 轉寄履歷 | 是否相同 |
|------|---------|---------|---------|
| title | `"履歷已刪除"` | `"履歷已刪除"` | 相同 |
| content | `["王小明", "以上送出失敗，求職者履歷已刪除"]` | `["王小明", "以上送出失敗，求職者履歷已刪除"]` | 相同（單人時無分隔符差異） |
| onClose | `reload()` | `reload()` | 相同 |

> 注意：單人時結果相同，但**多人時會出現分隔符差異**（同上 `00211` 的情況）。

---

### 超過每日接觸上限（聯絡 `00101` / 轉寄 `overView`）

假設 `viewMax/viewLimit = '100'`，`viewNow = '98'`

#### 聯絡功能 (`toOverViewErrorField`)

```js
const { detail: { viewLimit } } = error  // 只取 viewLimit

content: ["每日可接觸上限履歷 100 筆, 您已接觸 100 筆"]
```

#### 轉寄履歷 (`toOverViewErrorField`)

**情境 A：尚有餘額**（remainView = 100 - 98 = 2 > 0）

```js
content: ["今日尚可瀏覽 2 位求職者，已超過查詢上限，轉寄失敗。"]
```

**情境 B：無餘額**（viewNow = '100'，remainView = 0）

```js
content: ["每日可接觸上限履歷 100 筆, 您已接觸 100 筆"]
```

#### 比對結果

| 項目 | 聯絡功能 | 轉寄履歷 (尚有餘額) | 轉寄履歷 (無餘額) | 是否相同 |
|------|---------|-------------------|------------------|---------|
| title | `"超過每日可接觸上限"` | `"超過每日可接觸上限"` | `"超過每日可接觸上限"` | 相同 |
| content | `["每日可接觸上限履歷 100 筆, 您已接觸 100 筆"]` | `["今日尚可瀏覽 2 位求職者，已超過查詢上限，轉寄失敗。"]` | `["每日可接觸上限履歷 100 筆, 您已接觸 100 筆"]` | **不同**（尚有餘額時） |
| 已接觸數顯示 | 誤用 `viewLimit`（與上限值相同） | 正確使用 `viewNow` 計算 `remainView` | 正確使用 `viewNow` | **不同** |
| 是否區分餘額情境 | 否（固定文案） | 是（兩種分支） | 是（兩種分支） | **不同** |
| 是否列出失敗者姓名 | 否 | 否（adapter 未使用 payload.failedName） | 否 | 相同 |
| onClose | `undefined` | `undefined` | `undefined` | 相同 |

---

### 其他未列舉的錯誤（default）

假設 `message = "系統發生錯誤"`

#### 聯絡功能 (`toOtherErrorField`)

```js
content: ["系統發生錯誤"]   // 直接取 error.message
```

#### 轉寄履歷 (`toOtherErrorField`)

```js
// 若上游 message 為 object，會被轉為含 <br> 的字串
// 例如 message = { email: ["格式錯誤"] }
// → MsgText = "收件者格式錯誤<br>"

content: ["收件者格式錯誤<br>"]
```

#### 比對結果

| 項目 | 聯絡功能 | 轉寄履歷 (string message) | 轉寄履歷 (object message) | 是否相同 |
|------|---------|--------------------------|--------------------------|---------|
| title | `"提醒您"` | `"提醒您"` | `"提醒您"` | 相同 |
| content | `[error.message]` | `[MsgText]` | `[MsgText]`（含 `<br>` HTML） | **不同** — 轉寄的 message 可能含 HTML 標籤 |
| onClose | `null` | `null` | `null` | 相同 |

---

## 二、僅存在於單一模組的情境

### 僅存在於轉寄履歷

| Error Type | 情境 | Title | Content | onClose |
|-----------|------|-------|---------|---------|
| `pidNotActivate` | 求職者已關閉聯絡功能 | `"已關閉聯絡功能"` | `["{failedName}", "求職者已關閉聯絡功能"]` | `undefined` |
| `multiSrcSendFail` | ID 搜尋多筆送出失敗 | `"送出失敗"` | `["{failedName}", "以上送出失敗。"]` | `undefined` |

### 僅存在於聯絡功能

| Error Code | 情境 | Title | Content | onClose |
|-----------|------|-------|---------|---------|
| `00305` | 聯絡成功但未加入甄試流程 | `"聯絡成功，但人選未加入甄試流程(含行事曆)"` | `["請稍後再試，您仍可在聯絡訊息中查看已發送的訊息。"]` | `null` |
| `00310` | ATS 履歷空間已達上限 | `"聯絡成功，但人選無法加入甄試流程"` | `["甄試流程履歷空間已達上限..."]` | `null` |
| `00311` | ATS 部分開放履歷不可加入 | `"聯絡成功，但部分開放履歷無法加到甄試流程"` | `["人選並未全部開放履歷資料..."]` | `null` |

---

## 差異總結

| 比較維度 | 聯絡功能 (toBcEventErrorFields) | 轉寄履歷 (forwardErrorsModal) |
|---------|-------------------------------|------------------------------|
| 姓名分隔符號 | 頓號 `、`（ramda `join` + `innerJoin`） | 逗號 `,`（`Array.join(',')`) |
| `overView` 已接觸數 | 誤用 `viewLimit` | 正確使用 `viewNow` |
| `overView` 餘額分支 | 無（固定文案） | 有（兩種分支） |
| `overView` 失敗者姓名 | 不列出 | 不列出（上游有算但 adapter 未使用） |
| default message 格式 | 純文字 | 可能含 `<br>` HTML |
| 錯誤分類維度 | bc-comm 數字 error code（`00211` 等） | `ResumeToolsResponseType` 語意型別（`accessError` 等） |
