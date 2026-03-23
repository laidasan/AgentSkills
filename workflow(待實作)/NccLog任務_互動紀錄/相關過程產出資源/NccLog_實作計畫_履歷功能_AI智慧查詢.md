# 實作計畫：履歷功能_AI 智慧查詢 — NccLog 埋設

## Context

「AI 智慧查詢」頁面（`AISearchRecommendResumeList.vue`）的 6 個履歷功能 track_action（messageResume、saveResume、forwardResume、messageResumeOpen、clickInterviewButton、sendListInterviewButton）目前缺少 NccLog 所需的 ext 欄位（RC、serialNumber、pddScore、jobNo、Gar_id、pr）。

參照已完成的「AI 智慧查詢結果列表」（AiResumeList）實作模式，為此頁面補齊 NccLog 資料。

### 與 AiResumeList 的關鍵差異

| 項目 | AiResumeList | AiSearchRecommendResumeList |
|------|-------------|----------------------------|
| garId / pr | 從 API 回傳取得，存 Vuex state | API 不回傳，**固定空字串** |
| jobNo | 單一值，存 Vuex state | 每張 resumeCard 的 jobNo 不同（多職缺），需**動態取得** |
| 操作類型 | 單筆 + 多筆 | **僅單筆** |
| resumeCardUid 格式 | `{pageUid}_{resumeUid}`（複合） | `resume.uid`（單純，無 pageUid） |
| customNccLogExt | Manager getter，固定組合 | Manager 方法，依 resumeCardUid **動態組合** |
| input (查詢內容) | 有，從 state.query 取得 | **無此欄位**（不走自然語言搜尋） |

### 已確認的設計決策

1. **garId / pr 帶空字串**：`/resume/key-jobs/recommend` API 不回傳 garId、pr
2. **input 不需要帶**：此頁面不走自然語言搜尋，ext 規格中也未列 input
3. **serialNumber 跨分頁累計**：第一份分頁 `[1,2,3]`，第二分頁 `[4,5,6]`，依 keyJobs 順序累計
4. **ResumeLinkFactory RC**：使用 `AiResumeRc.Single`
5. **getCustomNccLogExt 方法**：因 jobNo 依 resumeCard 而異，使用方法（非 getter）動態組合

---

## 修改步驟

### Step 1：ResumePageManager — 計算 serialNumber

**檔案**：`com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/ResumePageManager.js`
**方法**：`convertResumesToResumePageList`

在 `convertResumesToResumePageList` 中，為每個 resumeCard 計算跨分頁連續的 serialNumber。

做法：追蹤累計 offset，每個 keyJob 的 resumes 依序編號：
```js
let serialNumberOffset = 0
return keyJobs.map((job) => {
  // ...existing code...
  const resumeCards = resumes.map((resume, index) => {
    return {
      ...toResumeCard({ resume, ... }),
      jobNo,
      serialNumber: serialNumberOffset + index + 1,  // 新增
      isShowSerialNumber: false,
      isShowFormCheckbox: false,
      canRedirectToResumeDetailPage: true
    }
  })
  serialNumberOffset += resumes.length  // 累加
  // ...return resumePage
})
```

### Step 2：convertResumeBOToBCContactResume — 加入 pddScore

**檔案**：`com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/AiSearchRecommendResumeListManager.js` (L103-112)

```js
const convertResumeBOToBCContactResume = resume => ({
  // ...existing fields...
  contactPrivacy: resume.contactPrivacy,
  pddScore: resume.pddScore  // 新增
})
```

### Step 3：AiSearchRecommendResumeListManager — 新增 getCustomNccLogExt 方法

**檔案**：同上 `AiSearchRecommendResumeListManager.js`

因為此頁面的 jobNo 依 resumeCard 而異，且 garId/pr 固定空字串，不適合用 getter。新增一個方法，從 resumeCardUid 動態組合 ext：

```js
getCustomNccLogExt (resumeCardUid) {
  const resumeCard = getResumeCardByUid(this.resumePageList)(resumeCardUid)
  return {
    Gar_id: '',
    pr: '',
    jobno: resumeCard ? resumeCard.jobNo : ''
  }
}
```

### Step 4：修改 4 個單筆操作方法 — 加入 pddScore、serialNumber、customNccLogExt

**檔案**：同上

參照 AiResumeList 模式，每個方法需要：
1. 取得 resumeCard（用 `getResumeCardByUid`）以取 serialNumber
2. 在 resume 物件中加入 pddScore、serialNumber
3. 傳入 customNccLogExt

修改的方法：
- [ ] `onResumeCardInvite` (L719)：加 `serialNumber`、`customNccLogExt`
- [ ] `onResumeCardSave` (L734)：加 `pddScore`、`serialNumber`、`customNccLogExt`
- [ ] `onResumeCardForward` (L758)：加 `pddScore`、`serialNumber`、`customNccLogExt`
- [ ] `onResumeCardQueue` (L801)：加 `pddScore`、`serialNumber`、`customNccLogExt`

以 `onResumeCardInvite` 為例：
```js
onResumeCardInvite (resumeCardUid) {
  const currentResumeCard = getResumeCardByUid(this.resumePageList)(resumeCardUid)

  this.resumeModalsManager.onInvite({
    userInfo: this.userInfo,
    resume: {
      ...convertResumeBOToBCContactResume(getResumeByResumeCardUid(this.resumePageList)(resumeCardUid)),
      serialNumber: currentResumeCard.serialNumber
    },
    customNccLogExt: this.getCustomNccLogExt(resumeCardUid)
  })
}
```

以 `onResumeCardSave` 為例：
```js
onResumeCardSave (resumeCardUid) {
  const currentResume = getResumeByResumeCardUid(this.resumePageList)(resumeCardUid)
  const currentResumeCard = getResumeCardByUid(this.resumePageList)(resumeCardUid)

  this.resumeModalsManager.onSave({
    resumes: [{
      uid: currentResume.uid,
      pId: currentResume.pId,
      source: currentResume.source,
      idNo: currentResume.idNo,
      snapshotId: currentResume.snapshotId,
      name: currentResume.candidateName,
      pddScore: currentResume.pddScore,
      serialNumber: currentResumeCard.serialNumber
    }],
    selectType: SelectType.Single,
    customNccLogExt: this.getCustomNccLogExt(resumeCardUid)
  })
}
```

`onResumeCardForward`、`onResumeCardQueue` 同理，各自加入 `pddScore`、`serialNumber`、`customNccLogExt`。

### Step 5：setup() — 設定 RC

**檔案**：同上，`setup()` 方法 (L353-381)

在 `this.setResumeModalsManager(...)` 之後加入：

```js
this.resumeModalsManager.singleEventRc = AiResumeRc.Single
```

只需設 `singleEventRc`（此頁面無多筆操作）。需 import `AiResumeRc`。

### Step 6：AISearchRecommendResumeList.vue — RC 設定

**檔案**：`com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/AISearchRecommendResumeList.vue` (L355-356)

將 `ResumeLinkFactory` 的 rc 從空字串改為 `AiResumeRc.Single`：
```js
const resumeLinkFactory = new ResumeLinkFactory({ rc: AiResumeRc.Single })
```

需 import `AiResumeRc`。

---

## 不需修改的部分

| 項目 | 原因 |
|------|------|
| `sendFeedbackNccLog` (L1178-1191) | pr/Gar_id 已正確為空字串，jobNo 已從 emit 參數取得 |
| `ResumeModalsManager.js` | 已在 AiResumeList 實作中完成 customNccLogExt 支援 |
| `AiResumeRc.js` | 列舉已建立，直接 import 使用 |

---

## 修改檔案清單

| 檔案 | 修改內容 |
|------|---------|
| `aiSearchRecommendResumeList/manager/ResumePageManager.js` | serialNumber 跨分頁累計計算 |
| `aiSearchRecommendResumeList/manager/AiSearchRecommendResumeListManager.js` | convertResumeBOToBCContactResume 加 pddScore、新增 getCustomNccLogExt、修改 4 個操作方法加入 pddScore/serialNumber/customNccLogExt、setup() 設定 singleEventRc |
| `aiSearchRecommendResumeList/AISearchRecommendResumeList.vue` | ResumeLinkFactory RC 設定為 AiResumeRc.Single |

---

## 驗證方式

1. 在 AI 智慧查詢頁面操作邀約/儲存/轉寄/初篩合格
2. 透過 DevTools Network 或 console 觀察 `nccLogService.pushLog` 發送的資料
3. 確認 ext 包含：`rc: '11031011'`、`sn`（正確流水號）、`pddscore`、`jobno`（對應職缺）、`Gar_id: ''`、`pr: ''`
4. 確認 serialNumber 跨分頁連續（第一個職缺 1,2,3，第二個職缺 4,5,6...）
5. 確認 FeedBack NccLog 不受影響（pr/Gar_id 維持空字串，jobNo 從 emit 取得）
