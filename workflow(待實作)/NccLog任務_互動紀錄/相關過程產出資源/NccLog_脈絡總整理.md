# NccLog 脈絡總整理

> 此文件是「導讀 + 索引」，供新 session 快速掌握 NccLog 整體脈絡。
> 各類別的詳細分析（track_action 清單、ext 欄位、觸發位置、代碼位置）請見對應的分析文件，本文不重複。

---

## 一、背景與範圍

此次 NccLog 需求來自 Excel 規格「B_Agent+測試版_NCC Log拷貝.xlsx」，涵蓋 4 大類別共 **24 個 track_action**，分佈在兩個頁面：

| 頁面 | Vue 元件 | 特性 |
|------|---------|------|
| **AI 智慧查詢結果列表** | `AIResumeList.vue` | 無限滾動分頁、單筆+多筆操作 |
| **AI 智慧查詢** | `AISearchRecommendResumeList.vue` | 一次取完、僅單筆操作 |

API 與 ext 欄位的原始說明 → 見 `B_Agent_驗證版_NccLog_相關文件.md`

---

## 二、NccLog 發送機制

### 發送方式
```js
window.nccLogService.pushLog({
  track: [trackAction],
  ext: { Buserid, custno, ...其他欄位 }
})
```

- `Buserid`、`custno`、`device` 由 `window.nccLogService` 自動處理，不需額外傳入

### 共用發送位置
- **履歷功能**（邀約、儲存、轉寄、初篩合格、列印）→ `ResumeModalsManager.sendNccLog()`（L2620）
- **FeedBack** → 目前在元件內有骨架但參數全空，規劃改為由父頁面 Manager 發送
- **其他**（viewlistSearch、viewsearchResult、inputQuery）→ 完全未實作

---

## 三、兩頁面的關鍵差異

| 項目 | AI 智慧查詢結果列表 | AI 智慧查詢 |
|------|-------------------|------------|
| 操作類型 | 單筆 + 多筆 | 僅單筆 |
| RC | 單筆 `11031011` / 多筆 `11031012` | `11031011` |
| jobNo 來源 | Vuex `state.aiResumeList.jobNo` | `resumePage.jobNo` |
| garId / pr | Vuex state 已存儲 | **不會有**，帶空字串 |
| pddScore | `resumeCard.resume.pddScore` | 同左 |
| serialNumber | 已有 | **未設定** |
| 無限滾動 | 有 | 無 |
| API | `/resume/nlp/search` | `/resume/key-jobs/recommend` |

---

## 四、4 大類別導讀

各類別的 track_action 清單、ext 欄位需求、觸發位置、代碼位置等，已在各分析文件中完整記錄。以下僅列出類別概要與對應文件。

| 類別 | track_action 數量 | 分析文件 |
|------|------------------|---------|
| 履歷功能_AI 智慧查詢 | 6（僅單筆） | `NccLog_分析_履歷功能_AI智慧查詢.md` |
| 履歷功能_AI 智慧查詢結果列表 | 12（單筆+多筆） | `NccLog_分析_履歷功能_AI智慧查詢結果列表.md` |
| 履歷推薦回饋 FeedBack | 3（clicklike / clickunlike） | `NccLog_分析_履歷推薦回饋_FeedBack.md` |
| 其他 | 3（viewlistSearch / viewsearchResult / inputQuery） | `NccLog_分析_其他.md` |

---

## 五、跨類別共通問題

這些問題橫跨多個類別，是各分析文件中獨立提到但本質相同的問題：

### 已解決
- **garId、pr 的存儲**：AIResumeList 已在 Vuex state 中存儲（`state.aiResumeList.garId`、`.pr`），由 `ResumePageManager` 在 API 回傳後寫入
- **pddScore 的存儲**：已在 `AiResumeBO` 中定義，透過 `resumeCard.resume.pddScore` 取得
- **RC 已設定（AI 智慧查詢結果列表）**：透過 `AiResumeRc` 列舉，在 `AiResumeListManager.setup()` 中設定 `singleEventRc`、`multiEventRc`、`singleEventRcForwardResume`、`multiEventRcForwardResume`
- **garId、pr、pddscore、sn 已組裝進 sendNccLog 的 ext**：透過 `customNccLogExt` 參數傳遞 garId/pr/jobno/input，pddscore/sn 從 resumes 中取得

### 未解決
1. **AI 智慧查詢頁的 sn (serialNumber) 未設定**（影響「履歷功能_AI 智慧查詢」）
2. **「其他」類別的 RC 待確認**（Excel 未指定具體值）
3. **AI 智慧查詢頁的 RC 未設定**（影響「履歷功能_AI 智慧查詢」，列舉 `AiResumeRc` 已建立可直接使用）

---

## 六、已確認的設計決策

以下決策在對話中與使用者確認，後續實作應遵循：

1. **FeedBack NccLog 發送位置**：不在 `ResumeFitFeedback.vue` 元件內發送，而是 emit 事件到父頁面，由父頁面的 Manager 負責發送
2. **Emit 格式**：參數形式（非物件形式），順序為 `(event, idNo, pddScore, jobNo[, reasonId])`
   - `$emit('positiveFeedback', event, this.idNo, this.pddScore, this.jobNo)`
   - `$emit('negativeFeedback', event, this.idNo, this.pddScore, this.jobNo)`
   - `$emit('reasonClick', event, this.idNo, this.pddScore, this.jobNo, reasonId)`
3. **不使用 currying**：template 直接綁定 `@event="manager.method"`，manager 方法簽名為 `method(event, idNo, pddScore, jobNo)`，所需資料全部透過 props → emit 傳遞
4. **AISearchRecommendResumeList 的 garId / pr**：帶空字串
5. **FeedBack 取消行為**：再次點擊讚/倒讚可取消（toggle），取消時不送 NccLog
6. **Unlike 原因使用列舉**：不使用 index-based id，改用 `AiResumeUnlikeReason` 列舉值（1~5）作為 reason id，i18n 的 `negativeReasons` 也改為以列舉值為 key 的物件
7. **customNccLogExt 傳遞策略**：garId/pr/jobNo/query 不儲存在 ResumeModalsManager 上，而是由 AiResumeListManager 透過 `customNccLogExt` 參數傳入每個方法。pddscore/sn 則留在 ResumeModalsManager 內部從 resumes 取得，因為這兩個偏向 resume 自身資訊
8. **RC 列舉**：使用 `AiResumeRc` 列舉（`com/104/vip/rms/v3/core/lib/nccLog/AiResumeRc.js`），兩個頁面共用，包含 Single/Multi/SingleForwardResume/MultiForwardResume
9. **RC 設定位置**：在 `AiResumeListManager.setup()` 的 `setResumeModalsManager` 之後設定，而非在 `forceLoadFirstResumePage` 中，因為 RC 是固定值不需每次搜尋重設

---

## 七、注意事項

以下是實作過程中需注意的規則，供後續實作其他類別時參考：

### 7.1 `window.nccLogService` 已自動處理的欄位

使用 `window.nccLogService.pushLog()` 時，**不需要**在 ext 中手動帶入 `Buserid`、`custno`、`device`，這些由 nccLogService 內部自動處理。`ResumeModalsManager.sendNccLog()` 中有手動帶入 `Buserid`、`custno` 是歷史寫法，新增的 `sendFeedbackNccLog` 不需要沿用。

### 7.2 pddScore 不需要 `String()` 包裹

規格中 `pddscore` 在多筆場景需要逗號串接（如 `"0.85,0.72"`），但 FeedBack 是單筆操作，直接傳入 Number 即可。

### 7.3 避免不必要的 currying

若 handler 不需要 template 作用域中的額外資料（如 `resumeCard`），不要使用 currying 綁定。將所需資料透過 props 傳入元件，再由 emit 傳出，讓方法簽名保持扁平。

### 7.4 Manager 中 feedback 方法需要 bind

在 Manager 的 constructor 中，feedback handler 需要手動 `.bind(this)`，否則在 template 中作為事件 handler 使用時 `this` 會丟失：
```js
this.onPositiveFeedback = this.onPositiveFeedback.bind(this)
this.onNegativeFeedback = this.onNegativeFeedback.bind(this)
this.onReasonClick = this.onReasonClick.bind(this)
```

---

## 八、履歷功能 NccLog 工法決策

以下決策在「履歷功能_AI 智慧查詢結果列表」實作計畫審視中確認，適用於兩個頁面的履歷功能 NccLog 實作。

### 8.1 pddScore / serialNumber 的傳遞策略

NccLog ext 需要 `pddscore` 和 `sn`（serialNumber），但這兩個資料分散在不同物件上：
- `pddScore`：在 ResumeBO（`resume.pddScore`）
- `serialNumber`：在 resumeCard（`resumeCard.serialNumber`），不在 resume 上

**決策**：在 AiResumeListManager 呼叫 ResumeModalsManager 方法時，從兩個來源組合資料，一併傳入。

### 8.2 單筆操作：新增 `getResumeCardByResumeCardUid` helper

單筆操作方法（onResumeCardInvite, onResumeCardSave 等）的參數已有 `resumeCardUid`，可直接從 resumePageList 定位 resumeCard，不需要先轉成 resumeUid 再查找。

```js
const getResumeCardByResumeCardUid = resumePageList => resumeCardUid => {
  const { pageUid } = parseResumeCardUid(resumeCardUid)
  return pipe(
    find(propEq(pageUid)('uid')),
    propOr([])('resumeCards'),
    find(propEq(resumeCardUid)('uid'))
  )(resumePageList)
}
```

此 helper 與既有的 `getResumeByResumeCardUid` 同一模式，差別在從 `resumeCards` 而非 `resumes` 中查找。

### 8.3 多筆操作：從 resumeCards 出發，uid 配對 ResumeBO

既有的 `getCheckedResumeFromResumePageList` 只回傳 ResumeBO，沒有 serialNumber。

**決策**：
1. 新增 `getCheckedResumeCardsFromResumePageList` helper，取得已勾選的 resumeCards
2. 用 `getResumeUidFromResumeCard(card)` 取得 resumeUid
3. 從 `resumePage.resumes` 中 `find(r => r.uid === resumeUid)` 取得對應 ResumeBO
4. **不使用 index 配對**（checkedResumes[i] 對應 checkedCards[i]），避免隱含的順序假設
5. 資料量最多 50 筆，find 的 O(n²) 不需優化

### 8.4 `convertResumeBOToBCContactResume` 加入 pddScore

BC 聯絡（邀約）流程會將 ResumeBO 轉成 BCContactResume。原本的轉換不含 pddScore。

**決策**：在 `convertResumeBOToBCContactResume` 中直接加入 `pddScore: resume.pddScore`，呼叫端只需額外補 `serialNumber`（因 serialNumber 來自 resumeCard，不是 ResumeBO 的屬性）。

### 8.5 ResumeModalsManager 內部的 resumes re-mapping

ResumeModalsManager 的 `onWillingnessAsk`（L902-907）會將傳入的 resumes 再次 map 成只含 `name, hasBeenSent, idNo, snapshotId, pId` 的物件。

**結論**：此 re-mapping 是傳遞到另一個元件的流程，與 sendNccLog 無關，不需要特別處理。

### 8.6 garId/pr 設定時機

garId/pr/jobNo/query 只需在 `forceLoadFirstResumePage` 的 `.then()` 中設定一次。重新搜尋時也會經過 `forceLoadFirstResumePage`，所以會自動重新取得最新值，無需額外處理。

### 8.7 其他頁面影響

修改 ResumeModalsManager 的 sendNccLog 呼叫加入 Gar_id / pr / jobno / input / pddscore / sn，其他使用 ResumeModalsManager 的頁面（如搜尋頁面）會多送這些空值欄位。

**決策**：可以接受。

### 8.8 customNccLogExt 參數傳遞方式

garId/pr/jobNo/query 透過閉包方式（方法入口接收 `customNccLogExt = {}`），逐層傳遞到 sendNccLog。不使用 mutable state 儲存在 ResumeModalsManager 上。

- `AiResumeListManager` 定義 `get customNccLogExt()` 從 Vuex state 組合 `{ Gar_id, pr, jobno, input }`
- 每個呼叫 ResumeModalsManager 的方法都帶入 `customNccLogExt: this.customNccLogExt`
- ResumeModalsManager 方法簽名加入 `customNccLogExt = {}`（預設空物件，向後相容）
- `onInvite` 作為中介方法，需將 customNccLogExt 傳遞給下游的 `onWillingnessAsk`、`onInviteInterview`、`inquireJobOnboard`
- `saveResumesToFolder` 的遞迴呼叫（重複履歷處理）也需傳遞 customNccLogExt

### 8.9 RC 列舉 `AiResumeRc`

路徑：`com/104/vip/rms/v3/core/lib/nccLog/AiResumeRc.js`

```js
AiResumeRc = defineEnum({
  Single: '11031011',
  Multi: '11031012',
  SingleForwardResume: '11033011',
  MultiForwardResume: '11033012'
})
```

此列舉供 AI 智慧查詢結果列表與 AI 智慧查詢兩個頁面共用。

### 8.10 ResumeModalsManager ForwardResume RC getter/setter

`ResumeModalsManager` 原本缺少 `singleEventRcForwardResume` / `multiEventRcForwardResume` 的 getter/setter（但 `onForward` 方法中已使用），已補齊。

---

## 九、文件索引

| 文件 | 定位 |
|------|------|
| `B_Agent_驗證版_NccLog_相關文件.md` | 原始參考文件：API、代碼位置、ext 欄位說明、注意事項 |
| `NccLog_分析_履歷功能_AI智慧查詢.md` | 分析：6 個 track_action、ext 欄位、觸發流程、待補齊問題 |
| `NccLog_分析_履歷功能_AI智慧查詢結果列表.md` | 分析：12 個 track_action、單筆/多筆差異、與 AI 智慧查詢的對比 |
| `NccLog_分析_履歷推薦回饋_FeedBack.md` | 分析：3 個 feedback 事件、元件架構、兩頁面使用差異 |
| `NccLog_分析_其他.md` | 分析：viewlistSearch / viewsearchResult / inputQuery、觸發時機與差異 |
| `NccLog_實作計畫_履歷推薦回饋_FeedBack.md` | 實作規劃：FeedBack NccLog 的 5 步驟實作計畫（已完成規劃，尚未實作） |
| `NccLog_實作計畫_履歷功能_AI智慧查詢結果列表.md` | 實作規劃：履歷功能 NccLog 的 5 步驟實作計畫，含工法決策與 11 處 sendNccLog 呼叫點 |

---

## 十、實作進度

| 類別 | 分析 | 規劃 | 實作 |
|------|------|------|------|
| 履歷功能_AI 智慧查詢 | 完成 | 完成 | **完成** |
| 履歷功能_AI 智慧查詢結果列表 | 完成 | 完成 | **完成** |
| 履歷推薦回饋 FeedBack | 完成 | 完成 | **完成** |
| 其他 (viewlistSearch, viewsearchResult, inputQuery) | 完成 | 未開始 | 未開始 |
