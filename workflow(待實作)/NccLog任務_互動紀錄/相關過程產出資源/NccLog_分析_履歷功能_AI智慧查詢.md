# 履歷功能_AI 智慧查詢 — NccLog 分析

## Excel 規格整理

此頁面有 **6 個 track_action**，全部是**單筆操作**，RC 統一為 `11031011`：

| 行為 | track_action | RC | ext |
|------|-------------|-----|-----|
| BC溝通－單筆發送事件 | `messageResume` | 11031011 | rc |
| 單筆儲存履歷 | `saveResume` | 11031011 | rc |
| 單筆轉寄履歷 | `forwardResume` | 11031011 | rc |
| 點開邀約任一事件圖層－單筆 | `messageResumeOpen` | 11031011 | rc |
| 點開初篩合格圖層－單筆 | `clickInterviewButton` | 11031011 | rc |
| 單筆初篩合格 | `sendListInterviewButton` | 11031011 | rc |

## 發送位置

NccLog 的發送**統一在 `ResumeModalsManager.sendNccLog()`**（L2620），透過 `window.nccLogService.pushLog()` 發送。

各操作的觸發入口在 `AiSearchRecommendResumeListManager` 中：

| 使用者操作 | Manager 方法 | 呼叫 ResumeModalsManager 方法 |
|-----------|-------------|------------------------------|
| 點擊邀約 | `onResumeCardInvite(uid)` | `resumeModalsManager.onInvite()` |
| 點擊儲存 | `onResumeCardSave(uid)` | `resumeModalsManager.onSave()` |
| 點擊轉寄 | `onResumeCardForward(uid)` | `resumeModalsManager.onForward()` |
| 點擊初篩合格 | `onResumeCardQueue(uid)` | `resumeModalsManager.onQueue()` |

## 需要帶的 ext 資料

| ext 欄位 | 說明 | 資料來源 | 目前狀態 |
|----------|------|---------|---------|
| `rc` | 11031011 | 透過 `resumeModalsManager.singleEventRc` 取得 | **未設定**（`AISearchRecommendResumeList.vue` L358 有 `// TODO rc`） |
| `id_no` | 履歷 idNo | `resumePageList` 中 resume 物件的 `resume.idNo` | 已有 |
| `pid` | 履歷 pId | resume 物件的 `resume.pId` | 已有 |
| `sn` | 履歷流水編號 | 應為 `serialNumber`，需在 convert 時設定 | **未設定**（`ResumePageManager.convertResumesToResumePageList` 中未見） |
| `selectType` | 單筆/多筆 | 此頁面固定為 `SelectType.Single` | 已有 |
| `event_type` | BC 聯絡事件類型 | 由 BC 聯絡彈窗回傳 | 已有（ResumeModalsManager 內部處理） |
| `jobno` | 職缺編號 | 每個 resumePage 自身的 `resumePage.jobNo` | 已有（在 resumePageList 結構中） |
| `GAR_id` | 該次查詢回傳的 GAR id | 需從 API `/resume/key-jobs/recommend` 回傳取得 | **未存儲** |
| `pr` | PPERCENTILES | 需從 API 回傳取得 | **未存儲** |
| `pddscore` | 履歷餘弦相似度 | 需從 API 回傳每筆履歷中取得 | **未存儲** |

## 關鍵發現（待補齊）

1. **RC 未設定**：`AISearchRecommendResumeList.vue` L358 有 `// TODO rc`，`resumeModalsManager.singleEventRc` 沒有被設定為 `11031011`
2. **GAR_id、pr、pddscore 未存儲**：`ResumePageManager.forceLoadResumePage()` 拿到 `resumesMetadata` 後只解析了 `hasOnJob`、`browseLimit`，沒有保存 NccLog 需要的 `pr`、`GAR_id`；每筆履歷的 `pddscore` 也沒有在 convert 時保留
3. **sn (serialNumber) 未設定**：此頁面的 `convertResumesToResumePageList` 沒有設定 `serialNumber`
4. **此頁面只有單筆操作**，不需要 `multiEventRc`

## 相關代碼位置

| 檔案 | 說明 |
|------|------|
| `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/AISearchRecommendResumeList.vue` | 頁面元件 |
| `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/AiSearchRecommendResumeListManager.js` | 頁面管理器，串接履歷功能 |
| `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/ResumePageManager.js` | 履歷分頁管理器，負責 API 呼叫與資料轉換 |
| `com/104/vip/rms/v3/core/container/resumeFeatures/manager/ResumeModalsManager.js` | 履歷功能共用管理器，負責發送 NccLog |
