# 履歷功能_AI 智慧查詢結果列表 — NccLog 分析

## Excel 規格整理

此頁面有 **12 個 track_action**，分為**單筆 (RC: 11031011)** 和**多筆 (RC: 11031012)** 兩組：

### 單筆操作 (RC: 11031011)

| 行為 | track_action | RC | ext |
|------|-------------|-----|-----|
| BC溝通－單筆發送事件 | `messageResume` | 11031011 | rc |
| 單筆儲存履歷 | `saveResume` | 11031011 | rc |
| 單筆轉寄履歷 | `forwardResume` | 11031011 | rc |
| 點開邀約任一事件圖層－單筆 | `messageResumeOpen` | 11031011 | rc |
| 點開初篩合格圖層－單筆 | `clickInterviewButton` | 11031011 | rc |
| 單筆初篩合格 | `sendListInterviewButton` | 11031011 | rc |

### 多筆操作 (RC: 11031012)

| 行為 | track_action | RC | ext |
|------|-------------|-----|-----|
| BC溝通－多筆發送 | `messageResume` | 11031012 | rc |
| 多筆儲存履歷 | `saveResume` | 11031012 | rc |
| 多筆轉寄履歷 | `forwardResume` | 11031012 | rc |
| 多筆列印履歷 | `printResume` | 11031012 | rc |
| 點開邀約任一事件圖層－多筆 | `messageResumeOpen` | 11031012 | rc |
| 點開初篩合格圖層－多筆 | `clickInterviewButton` | 11031012 | rc |
| 多筆初篩合格 | `sendListInterviewButton` | 11031012 | rc |

## 發送位置

NccLog 的發送**統一在 `ResumeModalsManager.sendNccLog()`**（L2620），透過 `window.nccLogService.pushLog()` 發送。

### 單筆操作觸發入口（在 `AiResumeListManager` 中）

| 使用者操作 | Manager 方法 | 呼叫 ResumeModalsManager 方法 |
|-----------|-------------|------------------------------|
| 點擊邀約 | `onResumeCardInvite(uid)` | `resumeModalsManager.onInvite()` |
| 點擊儲存 | `onResumeCardSave(uid)` | `resumeModalsManager.onSave({ selectType: Single })` |
| 點擊轉寄 | `onResumeCardForward(uid)` | `resumeModalsManager.onForward({ selectType: Single })` |
| 點擊初篩合格 | `onResumeCardQueue(uid)` | `resumeModalsManager.onQueue({ selectType: Single })` |

### 多筆操作觸發入口（在 `AiResumeListManager` 中）

| 使用者操作 | Manager 方法 | 呼叫 ResumeModalsManager 方法 |
|-----------|-------------|------------------------------|
| 多筆邀約（詢問意願） | `onMultiWillingnessAsk()` | `resumeModalsManager.onWillingnessAsk({ selectType: Multi })` |
| 多筆邀約（面試邀約） | `onMultiInterview()` | `resumeModalsManager.onInviteInterview({ selectType: Multi })` |
| 多筆儲存 | `onMultiSave()` | `resumeModalsManager.onSave({ selectType: Multi })` |
| 多筆轉寄 | `onMultiForward()` | `resumeModalsManager.onForward({ selectType: Multi })` |
| 多筆初篩合格 | `onMultiQueue()` | `resumeModalsManager.onQueue({ selectType: Multi })` |
| 多筆列印 | `onMultiPrint()` | `resumeModalsManager.onPrint()` |

## 需要帶的 ext 資料

| ext 欄位 | 說明 | 資料來源 | 目前狀態 |
|----------|------|---------|---------|
| `rc` | 單筆 11031011 / 多筆 11031012 | 透過 `resumeModalsManager.singleEventRc` / `multiEventRc` 取得 | **未設定**（`AIResumeList.vue` L486 有 `// TODO 待確認 rc`） |
| `id_no` | 履歷 idNo，多筆時逗號隔開 | `resumePageList` 中 resume 物件的 `resume.idNo` | 已有 |
| `pid` | 履歷 pId，多筆時逗號隔開 | resume 物件的 `resume.pId` | 已有 |
| `sn` | 履歷流水編號 | `setupFollowerResumeCardWith` 中計算 `serialNumber`（L35: `(page - 1) * perPage + (resumeCardIndex + 1)`） | **已有**（在 `ResumePageManager.js` L35） |
| `selectType` | 單筆 `single` / 多筆 `multi` | 各方法中明確傳入 `SelectType.Single` 或 `SelectType.Multi` | 已有 |
| `event_type` | BC 聯絡事件類型 | 由 BC 聯絡彈窗回傳 | 已有（ResumeModalsManager 內部處理） |
| `jobno` | 職缺編號 | Vuex Store State `state.aiResumeList.jobNo` | 已有（從 route query 取得） |
| `GAR_id` | 該次查詢回傳的 GAR id | 需從 `/resume/nlp/search` API 回傳的 metadata 取得 | **未存儲**（`parseMetaData` 未解析此欄位） |
| `pr` | PPERCENTILES | 需從 API 回傳的 metadata 取得 | **未存儲**（`parseMetaData` 未解析此欄位） |
| `pddscore` | 履歷餘弦相似度，多筆時逗號隔開 | 需從 API 回傳每筆履歷中取得 | **未存儲** |

## 關鍵發現（待補齊）

1. **RC 未設定**：`AIResumeList.vue` L486 有 `// TODO 待確認 rc`，`resumeModalsManager.singleEventRc` 和 `multiEventRc` 都沒有被設定為 `11031011` / `11031012`
2. **GAR_id、pr 未存儲**：`parseMetaData`（`com/104/vip/rms/v3/core/adapter/aiResumeList/index.js` L32）目前只解析了 `blackJobCat`、`ec`、`fixedUpdateDate`、`hasOnJob`、`page`、`pageSize`、`totalPage`、`total`、`token`、`conditions`，缺少 `pr` 和 `garId`
3. **pddscore 未存儲**：每筆履歷的 `pddscore` 沒有在 `convertFollowerResumesToResumePage` / `parseResume` 時保留
4. **sn 已有**：此頁面的 `serialNumber` 已在 `setupFollowerResumeCardWith` 中正確計算
5. **jobNo 已有**：此頁面使用 Vuex State `state.aiResumeList.jobNo`，從 route query 初始化

## 與「AI 智慧查詢」頁面的差異

| 項目 | AI 智慧查詢 | AI 智慧查詢結果列表 |
|------|-----------|-------------------|
| 操作類型 | 僅單筆 | 單筆 + 多筆 |
| RC | 11031011 | 11031011 (單筆) / 11031012 (多筆) |
| jobNo 來源 | 每個 resumePage 自身的 `jobNo` | Vuex Store 統一的 `state.aiResumeList.jobNo` |
| serialNumber | 未設定 | 已有（`setupFollowerResumeCardWith`） |
| 無限滾動 | 無（一次取完） | 有（分頁載入，每頁載入也算曝光） |
| 多筆列印 | 無 | 有 (`printResume`) |

## 相關代碼位置

| 檔案 | 說明 |
|------|------|
| `com/104/vip/rms/v3/core/views/aiResumeList/AIResumeList.vue` | 頁面元件 |
| `com/104/vip/rms/v3/core/views/aiResumeList/managers/AiResumeListManager.js` | 頁面管理器，串接履歷功能（單筆+多筆） |
| `com/104/vip/rms/v3/core/views/aiResumeList/managers/ResumePageManager.js` | 履歷分頁管理器，負責 API 呼叫與資料轉換，含 `serialNumber` 計算 |
| `com/104/vip/rms/v3/core/views/aiResumeList/store/state.js` | Vuex State，含 `jobNo`、`query` 等 |
| `com/104/vip/rms/v3/core/adapter/aiResumeList/index.js` | `parseMetaData`，需補齊 `pr`、`garId` |
| `com/104/vip/rms/v3/core/container/resumeFeatures/manager/ResumeModalsManager.js` | 履歷功能共用管理器，負責發送 NccLog |
