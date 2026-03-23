# 實作計畫：履歷功能_AI 智慧查詢結果列表 — NccLog

## Context

AI 智慧查詢結果列表頁面有 7 個 unique track_action（單筆 RC: 11031011 / 多筆 RC: 11031012），目前 NccLog 的 sendNccLog 已在 ResumeModalsManager 中被呼叫，但 ext 缺少多個欄位（rc, garId, pr, pddscore, sn, jobno, input）。本計畫的目標是補齊這些 ext 欄位。

## 現狀分析

**已有（無需修改）**：
- garId, pr 已存在 Vuex state（`state.aiResumeList.garId`, `.pr`），parseMetaData 已解析、actions/mutations 已實作
- pddScore 已在 AiResumeBO 中定義（`resume.pddScore`）
- serialNumber 已在 ResumePageManager.setupFollowerResumeCardWith 中計算（在 resumeCard 上，非 resume 上）
- jobNo 已在 Vuex state
- query 已在 Vuex state
- ec 已正確設定到 resumeModalsManager
- garId/pr 的 Vuex state 更新在 ResumePageManager 內部（L118-119），在 promise resolve 前完成，AiResumeListManager 的 `.then()` 中可安全取用

**需補齊**：
1. RC 未設定（singleEventRc/multiEventRc 為空字串）
2. garId, pr, pddscore, sn, jobno, input 未帶入 sendNccLog 的 ext

**重要的資料結構差異**：
- `resumePage.resumes[i]` → AiResumeBO，有 pddScore、source、candidateName 等完整欄位
- `resumeCard.resume` → toResumeCard 產出的 plain object（view 層），有 pddScore 但**沒有 source**
- `resumeCard.serialNumber` → 在 resumeCard 上，不在 resume 上
- `convertResumeBOToBCContactResume(resumeBO)` → 產出 BCContactResume，沒有 pddScore / serialNumber

## 參數傳遞策略

### 設計決策

NccLog ext 的新增欄位分為兩類，採用不同的傳遞方式：

| 欄位 | 性質 | 傳遞方式 |
|------|------|---------|
| `Gar_id`, `pr`, `jobno`, `input` | 整個查詢共用 | 透過 `customNccLogExt` 參數，從 AiResumeListManager 傳入 ResumeModalsManager 方法 |
| `pddscore`, `sn` | 每筆履歷不同 | 從 resumes 物件中取得，在 ResumeModalsManager 的 sendNccLog 處組裝 |

**理由**：
- Gar_id/pr/jobno/input 是查詢層級的資料，透過方法參數傳遞，資料流明確、無隱含 mutable state
- pddscore/sn 是履歷自身的資訊，應跟隨 resume 物件傳遞

### customNccLogExt 的組裝（在 AiResumeListManager）

```js
const customNccLogExt = {
  Gar_id: this.state.aiResumeList.garId,
  pr: this.state.aiResumeList.pr,
  jobno: this.state.aiResumeList.jobNo,
  input: this.state.aiResumeList.query
}
```

### ResumeModalsManager 方法簽名變更

每個相關方法新增 `customNccLogExt = {}` 參數，預設空物件確保其他頁面不傳時不會壞：

```js
// 現有 → 改為
onWillingnessAsk ({ resumes, selectType })
  → onWillingnessAsk ({ resumes, selectType, customNccLogExt = {} })

onInviteInterview ({ resumes, selectType })
  → onInviteInterview ({ resumes, selectType, customNccLogExt = {} })

onSave ({ resumes, selectType })
  → onSave ({ resumes, selectType, customNccLogExt = {} })

onForward ({ resumes, selectType })
  → onForward ({ resumes, selectType, customNccLogExt = {} })

onQueue ({ resumes, selectType })
  → onQueue ({ resumes, selectType, customNccLogExt = {} })

onPrint ({ pageSource, resumes })
  → onPrint ({ pageSource, resumes, customNccLogExt = {} })
```

### sendNccLog 呼叫處的使用方式

`customNccLogExt` 透過 closure 在方法內部的 callback/promise chain 中自然可用：

```js
this.sendNccLog({
  trackAction: TrackAction.MessageResumeOpen,
  ext: {
    id_no: ...,
    pid: ...,
    selectType,
    rc,
    pddscore: join(',')(map(propOr('', 'pddScore'), resumes)),
    sn: join(',')(map(propOr('', 'serialNumber'), resumes)),
    ...customNccLogExt  // 展開 Gar_id, pr, jobno, input
  }
})
```

### saveResumesToFolder 的傳遞

`onSave` 內部呼叫 `saveResumesToFolder` 時，需要把 `customNccLogExt` 一路傳下去。`saveResumesToFolder` 內部有遞迴呼叫自己（重複儲存處理），每個呼叫點都要帶上 `customNccLogExt`：

```js
// saveResumesToFolder 簽名加入 customNccLogExt
saveResumesToFolder = async ({ param, folderName, ..., selectType, customNccLogExt = {} })
```

## 實作步驟

### Step 1: 在 AiResumeListManager 設定 RC

**檔案**: `com/104/vip/rms/v3/core/views/aiResumeList/managers/AiResumeListManager.js`

在 `forceLoadFirstResumePage` 的 `.then()` 回調中（~L1672，ec 設定之後），設定 RC：
```js
this.resumeModalsManager.singleEventRc = '11031011'
this.resumeModalsManager.multiEventRc = '11031012'
```

> RC 仍使用 property 設定，因為這是所有頁面共用的機制。

### Step 2: 在 AiResumeListManager 的單筆/多筆方法中加入 pddScore、serialNumber、customNccLogExt

**檔案**: `com/104/vip/rms/v3/core/views/aiResumeList/managers/AiResumeListManager.js`

#### 2a - 新增 helper

新增 `getCheckedResumeCardsFromResumePageList`，取得已勾選的 resumeCards：
```js
/**
 * @function getCheckedResumeCardsFromResumePage
 * @param {ResumePage} resumePage
 * @returns {Array.<ResumeCard>}
 * @description 取得已勾選的履歷卡片
 */
const getCheckedResumeCardsFromResumePage = compose(
  filter(prop('isChecked')),
  prop('resumeCards')
)

/**
 * @function getCheckedResumeCardsFromResumePageList
 * @param {Array.<ResumePage>} resumePageList
 * @returns {Array.<ResumeCard>}
 * @description 取得已勾選的履歷卡片
 */
const getCheckedResumeCardsFromResumePageList = reduce(useWith(concat)([
  identity,
  getCheckedResumeCardsFromResumePage
]), [])
```

#### 2b - 異動 `convertResumeBOToBCContactResume`

在 `convertResumeBOToBCContactResume`（L199）中新增 `pddScore`：
```js
const convertResumeBOToBCContactResume = resume => ({
  uid: resume.uid,
  name: resume.candidateName,
  idNo: resume.idNo,
  snapshotId: resume.snapshotId,
  pId: resume.pId,
  isHalfShow: false,
  hasBeenSent: resume.hasContact,
  contactPrivacy: resume.contactPrivacy,
  pddScore: resume.pddScore              // 新增
})
```

#### 2c - 新增 helper `getResumeCardByResumeCardUid`

與 `getResumeByResumeCardUid` 同一模式，但從 `resumeCards` 中找 resumeCard：
```js
/**
 * @function getResumeCardByResumeCardUid
 * @param {Array.<ResumePage>} resumePageList
 * @param {string} resumeCardUid
 * @returns {ResumeCard}
 * @description 從 resumePageList 中透過 resumeCardUid 取得 resumeCard
 */
const getResumeCardByResumeCardUid = resumePageList => resumeCardUid => {
  const { pageUid } = parseResumeCardUid(resumeCardUid)

  return pipe(
    find(propEq(pageUid)('uid')),
    propOr([])('resumeCards'),
    find(propEq(resumeCardUid)('uid'))
  )(resumePageList)
}
```

#### 2d - 新增 `buildCustomNccLogExt` helper（class 內部方法）

在 AiResumeListManager class 中新增一個方法，統一組裝 customNccLogExt：
```js
get customNccLogExt () {
  return {
    Gar_id: this.state.aiResumeList.garId,
    pr: this.state.aiResumeList.pr,
    jobno: this.state.aiResumeList.jobNo,
    input: this.state.aiResumeList.query
  }
}
```

#### 2e - 單筆操作

在 `onResumeCardSave`（L1477）, `onResumeCardForward`（L1501）, `onResumeCardQueue`（L1544）, `onResumeCardInvite`（L1462）中：

- 用 `getResumeCardByResumeCardUid` 直接從 resumePageList 找 resumeCard
- 在傳給 ResumeModalsManager 的 resume 物件中加入 `pddScore` 和 `serialNumber`
- 傳入 `customNccLogExt`

範例（以 onResumeCardSave 為例）：
```js
onResumeCardSave (resumeCardUid) {
  const currentResume = getResumeByResumeCardUid(this.resumePageList)(resumeCardUid)
  const currentResumeCard = getResumeCardByResumeCardUid(this.resumePageList)(resumeCardUid)

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
    customNccLogExt: this.customNccLogExt
  })
}
```

邀約（onResumeCardInvite）：`convertResumeBOToBCContactResume` 已含 pddScore，只需補 serialNumber：
```js
onResumeCardInvite (resumeCardUid) {
  const currentResumeCard = getResumeCardByResumeCardUid(this.resumePageList)(resumeCardUid)

  this.resumeModalsManager.onInvite({
    userInfo: this.userInfo,
    resume: {
      ...convertResumeBOToBCContactResume(getResumeByResumeCardUid(this.resumePageList)(resumeCardUid)),
      serialNumber: currentResumeCard.serialNumber
    },
    customNccLogExt: this.customNccLogExt
  })
}
```

#### 2f - 多筆操作

策略：從 resumeCards 出發，用 `getResumeUidFromResumeCard` 取得 resumeUid，再從 `resumePage.resumes` 中 find 對應的 ResumeBO（uid 配對）。不使用 index 配對的隱含假設。

資料量最多 50 筆，find 的 O(n²) 不需要優化。

**非邀約多筆**（onMultiSave, onMultiForward, onMultiQueue, onMultiPrint）：
```js
onMultiSave () {
  if (this.allCheckedCardsCount > 0) {
    const checkedCards = getCheckedResumeCardsFromResumePageList(this.resumePageList)
    const allResumes = flatten(map(prop('resumes'))(this.resumePageList))

    this.resumeModalsManager.onSave({
      resumes: checkedCards.map(card => {
        const resumeUid = getResumeUidFromResumeCard(card)
        const resume = allResumes.find(r => r.uid === resumeUid)
        return {
          uid: resume.uid,
          pId: resume.pId,
          source: resume.source,
          idNo: resume.idNo,
          snapshotId: resume.snapshotId,
          name: resume.candidateName,
          pddScore: resume.pddScore,
          serialNumber: card.serialNumber
        }
      }),
      selectType: SelectType.Multi,
      customNccLogExt: this.customNccLogExt
    })
  } else {
    window.alert(this.alertDictionary.noResumeSelected)
  }
}
```

**邀約多筆**（onMultiWillingness, onMultiInterview）：`convertResumeBOToBCContactResume` 已含 pddScore，只需補 serialNumber：
```js
onMultiWillingness () {
  if (this.allCheckedCardsCount > 0) {
    const checkedCards = getCheckedResumeCardsFromResumePageList(this.resumePageList)
    const allResumes = flatten(map(prop('resumes'))(this.resumePageList))

    const checkedResumes = checkedCards.map(card => {
      const resumeUid = getResumeUidFromResumeCard(card)
      const resume = allResumes.find(r => r.uid === resumeUid)
      return {
        ...convertResumeBOToBCContactResume(resume),
        serialNumber: card.serialNumber
      }
    })

    // ... 後續邏輯不變（isShowAllHaveBeenSentConfirmModal 等），
    // 但傳給 resumeModalsManager 時加入 customNccLogExt:
    this.resumeModalsManager.onWillingnessAsk({
      resumes: checkedResumes,
      selectType: SelectType.Multi,
      customNccLogExt: this.customNccLogExt
    })
  }
}
```

### Step 3: 在 ResumeModalsManager 方法中接收並傳遞 customNccLogExt

**檔案**: `com/104/vip/rms/v3/core/container/resumeFeatures/manager/ResumeModalsManager.js`

#### 3a - 方法簽名變更

6 個入口方法加入 `customNccLogExt = {}`：
- `onWillingnessAsk ({ resumes, selectType, customNccLogExt = {} })`
- `onInviteInterview ({ resumes, selectType, customNccLogExt = {} })`
- `onSave ({ resumes, selectType, customNccLogExt = {} })`
- `onForward ({ resumes, selectType, customNccLogExt = {} })`
- `onQueue ({ resumes, selectType, customNccLogExt = {} })`
- `onPrint ({ pageSource, resumes, customNccLogExt = {} })`

#### 3b - 11 處 sendNccLog 呼叫加入新 ext 欄位

完整的 11 處 sendNccLog 呼叫點：

| # | track_action | BC 事件 | 約略行號 | resumes 來源 |
|---|-------------|---------|---------|-------------|
| 1 | `messageResumeOpen` | Willingness | L1034 | resumes 陣列 |
| 2 | `messageResume` | Willingness | L1016 | resumes 陣列 |
| 3 | `messageResumeOpen` | Interview | L1245 | resumes 陣列 |
| 4 | `messageResume` | Interview | L1227 | resumes 陣列 |
| 5 | `messageResumeOpen` | Inquire | L1429 | **單一 resume 物件** |
| 6 | `messageResume` | Inquire | L1396 | **單一 resume 物件** |
| 7 | `forwardResume` | — | L1689 | resumes 陣列 |
| 8 | `saveResume` | — | L2454 | resumeIdNos/resumePIds（已展開） |
| 9 | `clickInterviewButton` | — | L2016 | resumes 陣列 |
| 10 | `sendListInterviewButton` | — | L2079 | resumes 陣列 |
| 11 | `printResume` | — | L2253 | resumes 陣列 |

每處新增的 ext 欄位模式（resumes 為陣列時）：
```js
pddscore: join(',')(map(propOr('', 'pddScore'), resumes)),
sn: join(',')(map(propOr('', 'serialNumber'), resumes)),
...customNccLogExt
```

**注意 #5, #6 (Inquire)**：使用單一 resume 物件，需改為：
```js
pddscore: propOr('', 'pddScore')(resume),
sn: propOr('', 'serialNumber')(resume),
...customNccLogExt
```

**注意 #8 (SaveResume)**：此處 `resumeIdNos`/`resumePIds` 是已展開的陣列，pddscore/sn 需從上層 closure 的原始 `resumes` 取得。

> `Gar_id` 的大小寫與 FeedBack 實作一致。

#### 3c - saveResumesToFolder 傳遞 customNccLogExt

`saveResumesToFolder` 簽名加入 `customNccLogExt = {}`：
```js
saveResumesToFolder = async ({ param, folderName, idNoResumes, snapshotIdResumes, resumeUIds, resumePIds, resumeIdNos, selectType, customNccLogExt = {} })
```

`onSave` 中所有呼叫 `saveResumesToFolder` 的地方（2 處）以及 `saveResumesToFolder` 內部遞迴呼叫自己的地方（2 處），都要帶上 `customNccLogExt`。

### Step 4: 處理 AIResumeList.vue 中的 RC TODO

**檔案**: `com/104/vip/rms/v3/core/views/aiResumeList/AIResumeList.vue`

移除 L516 的 `// TODO 待確認 rc` 註解，將 `ResumeLinkFactory` 的 rc 設為 `'11031011'`。

## 已確認事項

1. **參數傳遞方式**：Gar_id/pr/jobno/input 透過 `customNccLogExt` 參數傳遞，不存在 ResumeModalsManager 上 ✅
2. **pddscore/sn 取值方式**：在 ResumeModalsManager 的 sendNccLog 處從 resumes 取得，因為這是履歷自身的資訊 ✅
3. **其他頁面影響**：`customNccLogExt = {}` 預設空物件，其他頁面不傳時展開為空，不會壞 ✅
4. **邀約（BC 聯絡）的 NccLog**：需要加入新 ext 欄位 ✅
5. **garId/pr 設定時機**：每次呼叫時從 Vuex state 即時取得，重新搜尋後自動取到最新值 ✅
6. **garId/pr 取值安全**：ResumePageManager 在 promise resolve 前已更新 Vuex state，AiResumeListManager 的方法中可安全取用 ✅
7. **多筆操作策略**：從 resumeCards 出發，用 resumeUid 從 resumePage.resumes find 對應 ResumeBO，不使用 index 配對 ✅
8. **資料量**：多筆最多 50 筆，find O(n²) 不需優化 ✅
9. **re-mapping 不影響**：onWillingnessAsk L902-907 的 re-mapping 是傳到另一個元件的流程，與 sendNccLog 無關 ✅

## 關鍵檔案

| 檔案 | 修改內容 |
|------|---------|
| `ResumeModalsManager.js` | 6 個方法簽名加入 `customNccLogExt`；`saveResumesToFolder` 簽名加入 `customNccLogExt`；11 處 sendNccLog 呼叫加入 pddscore/sn/...customNccLogExt |
| `AiResumeListManager.js` | 新增 helpers（getCheckedResumeCardsFromResumePageList, getResumeCardByResumeCardUid）；新增 `customNccLogExt` getter；異動 convertResumeBOToBCContactResume；設定 RC；單筆/多筆方法中加入 pddScore/serialNumber/customNccLogExt |
| `AIResumeList.vue` | 修正 RC TODO |

## 實作注意事項

1. **Inquire 流程是單一 resume**（#5, #6），pddscore/sn 取值方式與陣列不同
2. **SaveResume（#8）的 resumes 已被展開**為 resumeIdNos/resumePIds，pddscore/sn 需從上層 closure 的原始 resumes 取
3. **convertResumeBOToBCContactResume** 已加入 pddScore 欄位，serialNumber 在呼叫端從 resumeCard 補上
4. **saveResumesToFolder 有遞迴呼叫**（重複儲存處理），每個遞迴呼叫點都要傳遞 `customNccLogExt`

## 驗證方式

1. 在 AI 智慧查詢結果列表頁面操作單筆/多筆的邀約、儲存、轉寄、初篩合格、列印
2. 透過 DevTools Console 觀察 `window.nccLogService.pushLog` 的呼叫參數
3. 確認 ext 中包含正確的 rc, Gar_id, pr, jobno, input, pddscore, sn, id_no, pid, selectType
4. 確認單筆時 pddscore/sn 為單一值，多筆時為逗號分隔
5. 確認其他頁面（非 AI 查詢結果列表）的 NccLog 沒有被破壞（customNccLogExt 預設空物件）
