# 想法集中地

## Workflow

* 參考 SuperPower 的 頭腦風暴
* 參考 OpenSepc 的 SDD 驅動

撰寫成自己的 WorkFlow

大致上流程會是：

1. SuperPower BrainStrom  ( SKILL, 拿 superpower 的，改 SKILL.md)
2. 輸出/更新 PRD ; BrainStorm 文件 ; 
3. OpenSpec 的「提案」、「Design」、「spec」、「task」
    這裡的「Design」 可能需要克制，視情況需要 UML 圖。
4. 針對 task , 視情況再進行細節填充。
5. TDD 驅動開發，開始實作 task ( 可能拿 superpower 的 SKILL 來改 )
6. Reivew 與 測試

---

## 專案知識封裝
針對 recruitment 專案深度探索，將程式轉換成 規格/PRD 並分類，且每個內容有相關代碼檔案的 context 資訊，個別寫成 SKILL, 
同時在各種「專案知識的 SKILL」前，會有一個類似「索引」，詢問 LLM 相關知識前，會使用這個「索引」來協助 LLM 判斷代碼與規格可能的位置，使之減少 token 消耗(一次 SKILl metadata 知識灌入到 context)，
與提高精準度。

* 也可能全部內容包裝成一個 SKILL, 「專案知識」為 「reference」，該 SKILL 本身就是一個「索引」。
* 索引也可能可以參考 `RAG` 的分尚，或使普通的 JSON。
* 索引可能可以參考 `auto-skill` 的類似作法 (使用JSON)。
* 索引也可能類似 SKILL metadata 的方式，每個「專案知識」都會有 metadat, 等到需要的時候再載入相關的資訊到 context。

可能 code Review 也會使用到這個知識封裝的 SKILL。
---

## 多 Agent 協作

### 記憶管理分層 (Scope)
記憶管管理也需要分層，大致上會有：
* Global - 所有 agent 共享共有。
* Group - 該 Group 下，所有 Agent 擁有的記憶層。這裡的 `Project` ，可能可以思考為一個 Repo、目錄，也就在 Global 內，會在有一層 Group，在這個 Group 內的 Agent 所共有的記憶。
若脫離這個 Group，Agent 則不再載入相關記憶到 context。
* Agent - 該 Agent 自己擁有的記憶層。

### 跨 Agent 對話
多 agnet 管理的一部分，每個 agent 會各自不知道自己的上下文，其 Agent 需要相互溝通，會需要有 Group 層級記憶外，各個 Agent 之間需要傳遞訊息，需要有一個「中介層」，
他有可能是透過「主 Agnet」傳遞與管理，也又可能是額外一個系統協助。

* 可以借鑑 https://github.com/louislva/claude-peers-mcp ，主要做了一個一個中介層，讓 Agent 之間傳送訊息。
* Claude-code 原生有 `/add-dir` ，可以在 context 中加入另外一個目錄到 context。

### sub agent 協作管理。
未來如果啟用 sub agent , 我希望他也能夠使用 AgentSKILl, 但現在 claude code 的 sub agent 不支援 skill , 取而代之的可能是直接寫入到 「該 subagent 的 設定.md 檔案」，可能在其中引用某個 SKILL 的 SKILL.md 檔案。
但也可能我可以做一個介面管理，可以去設定 sub agent 需要使用哪些 SKILL, 為每個 sub agent 制定 「人格」、「技能」等，但其實背後實作方式可能是：
* A：用程式去輔助調整 sub agent 的設定檔。
* B: 啟用 sub agent 時，背後讀取相關 SKILL 的 metadat, 喂給 sub agent

可以參考:
* 官方 skill-creator 呼叫 subagent 的方式。
* 社群上手搓龍蝦，手搓 Agent 協作的方式。
* Claude Code 內建的 「Agent Team」功能。
* 可能不是 sub agent，有可能是啟用另外一個 主 Agent ，有自己的 context。


目前我所知的 claude code sub agent 限制與注意事項：
* 使用工具, 如 MCP , 會需要賦予權限
* 沒辦法使用 AgentSKill
* sub agent 之間沒有辦法溝通 (但 Agent Team 功能可以，可能不是單純的 sub agent)

---

## 跨 session，延續 session
Claude Code 預設在一個 sessoion 在 80% 的時候，會壓縮上下文。
可能較好的做法是，提早(例如 context 已經佔用 40%)將上下文總結並壓縮，並清理或開啟新的 session，繼續新一輪的對話，對於品質可能會有相對應的提升。
Agent 也能夠較好運作。

這部分可能可以使用一個 SKILL  + hook 來達成，或是手動呼叫 SKILL。
可以借鑑社群上已有的 SKILL。

---


## Reference
* 可借鑑 https://github.com/garrytan/gstack , 參考他 SKILL 的用法和 SKILL 寫法。
* 可借鑑 anthropic 官方的 Skill-creator 的 SKILL 寫法與呼叫 subagent 的方式。
* 可借鑑 Claude code Agent Team 功能，找尋 agent 之間協作的方式。
* 可借鑑 社群上 (cablat etc.)等，使用 Agent 協作的方式。
* 可借鑑 Anthropoic 黑客松冠軍選手的 SKILL 集合 everything-claude-code - https://github.com/affaan-m/everything-claude-code
包含 SKILL 與 workflow、跨對話管理、上下文壓縮等。
  * Continuous Learning v2：可能是類似於 auto-skill的功能，讓 AI 從每次的互動中學習經驗，也能夠累積特定 repo 的記憶。總言之應該是一個「從每次對話擷取擷取內容，並作爲記憶的概念」
* 可借鑑 社群上 https://github.com/sd0xdev/sd0x-dev-flow/tree/main 的工作流。


## Note:
* 每個 SKILL 可以做成單一職責。
* SKILL 可以撰寫「角色」、「人格」。
* 符合單一職責的 「人格」和「技能」可以組合與搭配。
* 可以多利用 Claude Code 本身提供的 hook，可以在執行任務前、後等做不同的事情。