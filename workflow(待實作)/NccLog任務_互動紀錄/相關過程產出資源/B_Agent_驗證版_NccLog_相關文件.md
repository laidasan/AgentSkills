## 說明與相關代碼位置：
* API 文件：resume-service_5.json
  * 「送出查詢 API」： `/resume/nlp/search`，此 API 會回傳 NccLog 所需要的欄位 
    * metadata: `pr`、`Gar_id`
    * data: 陣列中為每筆履歷，每筆履歷中有 `pddscore`
* 「履歷功能_AI 智慧查詢_取得推薦履歷列表 API」: `/resume/key-jobs/recommend`
* 「履歷功能」主要功能邏輯位置：com/104/vip/rms/v3/core/container/resumeFeatures/manager/ResumeModalsManager.js
* 串接「履歷功能的地方」
  * 履歷功能_AI 智慧查詢結果列表: com/104/vip/rms/v3/core/views/aiResumeList/managers/AiResumeListManager.js
  * 履歷功能_AI 智慧查詢: com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/manager/AiSearchRecommendResumeListManager.js
* 履歷推薦回饋 Feedback: com/104/vip/rms/v3/core/views/aiResumeSearch/container/resumeFitFeedback/ResumeFitFeedback.vue

* 職缺履歷列表曝光時觸發-每次載入都會觸發：意指在 `com/104/vip/rms/v3/core/views/aiResumeList/AIResumeList.vue` 和 `com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/AISearchRecommendResumeList.vue` 內的「履歷」「履歷資料載入後」。
  * com/104/vip/rms/v3/core/views/aiResumeList/AIResumeList.vue 有「無限滾動」來載入分頁，所以載入分頁履歷時，也算該分頁履歷「曝光」。
  * com/104/vip/rms/v3/core/views/aiSearchRecommendResumeList/AISearchRecommendResumeList.vue 只有取一次資料，所以是每次進頁面取得履歷資料後就算「曝光」。

* 點擊自然語言搜尋介面「送出按鈕」，拿到GAR回傳內容時：意指在取得履歷資料時，若後端回傳 gardId 有值，即觸發。
* 發送 NccLog 注意事項
  * 使用 `window.nccLogService` 發送 NccLog
  * `ext` 只需要在意以下欄位，其餘欄位已經打包在 `window.nccLogService` 處理 ：
    * rc: 參考 Excel 中的 `此次新增RC` 表的內容。
    * input: 自然語言查詢內容, 「送出查詢 API」 中的 `query` 欄位
    * id_no: 履歷的idno，多筆時逗號隔開
    * pid: 履歷 pid
    * sn: 履歷流水編號，應該都會在取得履歷資料後，前端進行 convert 處理，例如 com/104/vip/rms/v3/core/views/aiResumeList/managers/ResumePageManager.js 的 `setupFollowerResumeCardWith `，欄位 `serialNumber`
    * selectType: 多筆或單筆操作
    * event_type: 履歷邀約相關事件的 type enum
    * jobno: 
      * 「履歷功能_AI 智慧查詢結果列表」使用自身 Vux Store State 的 `jobNo`
      * 「履歷功能_AI 智慧查詢」: 使用每個履歷分頁自身的 jobNo
    * pr: 從 API resopnse 取得
    * GAR_id: 從 API response 取得
    * pddscore: 從 API response 取得

