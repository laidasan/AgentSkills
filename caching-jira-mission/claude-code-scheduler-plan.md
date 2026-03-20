# Claude Code 排程自動化規劃文件

## 專案概述

透過 cron 排程，定時控制 iTerm2 視窗中的 Claude Code interactive session，自動送出 AgentSkill 指令，達成定時自動化任務的目的。

---

## 需求

### 功能需求

- 每 30 分鐘自動執行一次排程任務
- 送出指定的 AgentSkill slash command：`/caching-qa-issue {issue_id}`
- `issue_id` 由使用者固定給定（例如：`vipop-43538`）
- 執行前需確認 Claude Code 是否處於 idle 狀態，避免干擾進行中的任務

### 非功能需求

- 若 Claude Code 正忙碌（非 idle），最多等待 5 分鐘（重試 10 次，每次間隔 30 秒）
- 超時後略過此次任務，等待下一次排程觸發
- 上一次未執行到的任務，由下一次成功執行時一併處理
- 執行結果需寫入 log 檔案

### 環境限制

- macOS + iTerm2
- Claude Code 執行在獨立的 iTerm2 視窗，固定只有一個 session
- AgentSkill 只在 Claude Code interactive mode 可用（`-p` mode 不支援）

---

## 系統架構

```
cron（每 30 分鐘觸發）
  └─ scheduled-claude-task.sh（帶入 issue_id 參數）
       └─ send_claude.py（iTerm2 Python API）
            ├─ 偵測 Claude Code 是否 idle
            │    ├─ idle → 送出 /caching-qa-issue {issue_id}
            │    └─ busy → 等待 30 秒後重試（最多 10 次）
            └─ 超時 → 略過，寫入 log
```

---

## 實作規劃

### 檔案結構

```
~/
├── scripts/
│   ├── scheduled-claude-task.sh   # cron 呼叫的入口腳本
│   └── send_claude.py             # iTerm2 控制邏輯
└── logs/
    └── claude-schedule.log        # 執行記錄
```

---

### 1. iTerm2 Python API 控制腳本

**檔案：** `~/scripts/send_claude.py`

```python
#!/usr/bin/env python3
import iterm2
import asyncio
import sys
from datetime import datetime

async def is_claude_idle(session) -> bool:
    """
    透過讀取 session 最後一行，判斷 Claude Code 是否在等待輸入。
    Claude Code idle 時，最後一行為 prompt 符號（>、❯ 或空白）。
    """
    contents = await session.async_get_screen_contents()
    last_line = contents.line_at_index(contents.number_of_lines - 1)
    text = last_line.string.strip()
    return text in [">", "❯", ""]

async def send_when_idle(connection):
    issue_id = sys.argv[1]
    message = f"/caching-qa-issue {issue_id}"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    app = await iterm2.async_get_app(connection)

    # 定位指定的 session（透過 tab title）
    target_session = None
    for window in app.windows:
        for tab in window.tabs:
            if tab.name == "claude-scheduler":
                target_session = tab.sessions[0]
                break

    if target_session is None:
        print(f"[{timestamp}] ❌ 找不到 claude-scheduler tab，請確認 iTerm2 tab 命名是否正確")
        return

    # 最多重試 10 次，每次等待 30 秒（共 5 分鐘）
    max_retries = 10
    for attempt in range(max_retries):
        if await is_claude_idle(target_session):
            await target_session.async_send_text(message + "\n")
            print(f"[{timestamp}] ✅ 已送出：{message}")
            return

        print(f"[{timestamp}] ⏳ Claude 正在執行，等待重試（{attempt + 1}/{max_retries}）")
        await asyncio.sleep(30)

    print(f"[{timestamp}] ❌ 超過重試次數，本次任務略過")

iterm2.run_until_complete(send_when_idle)
```

---

### 2. Shell 入口腳本

**檔案：** `~/scripts/scheduled-claude-task.sh`

```bash
#!/bin/bash

ISSUE_ID=$1

if [ -z "$ISSUE_ID" ]; then
  echo "❌ 未提供 issue_id，請確認 crontab 設定"
  exit 1
fi

# 確保 log 目錄存在
mkdir -p ~/logs

# 執行 Python 腳本
python3 ~/scripts/send_claude.py "$ISSUE_ID"
```

賦予執行權限：

```bash
chmod +x ~/scripts/scheduled-claude-task.sh
```

---

### 3. cron 排程設定

```bash
crontab -e
```

新增以下排程（每 30 分鐘執行，固定 issue_id 為 vipop-43538）：

```
*/30 * * * * ~/scripts/scheduled-claude-task.sh vipop-43538 >> ~/logs/claude-schedule.log 2>&1
```

---

## iTerm2 前置設定

### 安裝 iTerm2 Python API

1. 開啟 iTerm2
2. 前往 `Scripts` → `Manage` → `Install Python Runtime`

### 將 Claude Code tab 命名為 `claude-scheduler`

1. 對 Claude Code 所在的 tab 按右鍵
2. 選擇 `Set Title`
3. 輸入 `claude-scheduler`

---

## Idle 判斷邏輯說明

| 最後一行內容 | 判斷結果 |
|---|---|
| `>` | idle，可送出指令 |
| `❯` | idle，可送出指令 |
| 空白 | idle，可送出指令 |
| 其他內容 | busy，等待重試 |

---

## 重試與超時策略

| 參數 | 數值 |
|---|---|
| 最大重試次數 | 10 次 |
| 每次等待時間 | 30 秒 |
| 最長等待時間 | 5 分鐘 |
| 超時後行為 | 略過，寫入 log |

---

## Log 格式範例

```
[2026-03-19 09:00:01] ✅ 已送出：/caching-qa-issue vipop-43538
[2026-03-19 09:30:01] ⏳ Claude 正在執行，等待重試（1/10）
[2026-03-19 09:30:31] ⏳ Claude 正在執行，等待重試（2/10）
[2026-03-19 09:35:01] ❌ 超過重試次數，本次任務略過
[2026-03-19 10:00:01] ✅ 已送出：/caching-qa-issue vipop-43538
```

---

## 注意事項

- cron 執行環境與 shell 不同，`python3` 路徑需確認為絕對路徑（可用 `which python3` 確認）
- iTerm2 必須保持開啟，cron 才能控制 session
- `claude-scheduler` tab 命名必須與腳本中的判斷字串一致
- issue_id 需要變更時，直接修改 crontab 中的參數即可，腳本不需改動
