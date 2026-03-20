/**
 * parse-cache.cjs
 *
 * 解析快取 md 檔案的 YAML frontmatter，輸出 JSON 到 stdout。
 *
 * Usage: node parse-cache.cjs <file-path>
 *
 * Output (JSON):
 *   - 檔案存在且解析成功: {"exists": true, "issues": [...], "lastUpdated": "...", "parentKey": "..."}
 *   - 檔案不存在:         {"exists": false, "issues": []}
 *   - 解析失敗:           {"exists": false, "issues": [], "error": "..."}
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.log(JSON.stringify({ exists: false, issues: [], error: 'No file path provided' }));
  process.exit(0);
}

const absolutePath = path.resolve(filePath);

if (!fs.existsSync(absolutePath)) {
  console.log(JSON.stringify({ exists: false, issues: [] }));
  process.exit(0);
}

try {
  const content = fs.readFileSync(absolutePath, 'utf-8');

  // 取出 YAML frontmatter（兩個 --- 之間的內容）
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log(JSON.stringify({ exists: false, issues: [], error: 'No YAML frontmatter found' }));
    process.exit(0);
  }

  const yaml = frontmatterMatch[1];
  const result = parseYaml(yaml);

  console.log(JSON.stringify({
    exists: true,
    parentKey: result.parentKey || '',
    lastUpdated: result.lastUpdated || '',
    issues: result.issues || []
  }));

} catch (err) {
  console.log(JSON.stringify({ exists: false, issues: [], error: err.message }));
  process.exit(0);
}

/**
 * 簡易 YAML parser，僅支援此快取檔案的固定結構：
 * - 頂層 key: value（字串）
 * - issues 陣列，每筆為固定欄位的 key: value
 */
function parseYaml(yaml) {
  const lines = yaml.split('\n');
  const result = { issues: [] };
  let currentIssue = null;
  let inIssues = false;

  for (const line of lines) {
    // 空行跳過
    if (line.trim() === '') continue;

    // issues 陣列開始
    if (line.match(/^issues:\s*$/)) {
      inIssues = true;
      continue;
    }

    if (inIssues) {
      // 新的 issue item（以 "  - key:" 開頭）
      const newItemMatch = line.match(/^\s+-\s+(\w+):\s*"?(.*?)"?\s*$/);
      if (newItemMatch) {
        if (currentIssue) {
          result.issues.push(currentIssue);
        }
        currentIssue = {};
        currentIssue[newItemMatch[1]] = stripQuotes(newItemMatch[2]);
        continue;
      }

      // issue 的後續欄位（以 "    key:" 開頭，無 -）
      const fieldMatch = line.match(/^\s+(\w+):\s*"?(.*?)"?\s*$/);
      if (fieldMatch && currentIssue) {
        currentIssue[fieldMatch[1]] = stripQuotes(fieldMatch[2]);
        continue;
      }
    } else {
      // 頂層 key: value
      const topLevelMatch = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
      if (topLevelMatch) {
        result[topLevelMatch[1]] = stripQuotes(topLevelMatch[2]);
      }
    }
  }

  // 最後一筆 issue
  if (currentIssue) {
    result.issues.push(currentIssue);
  }

  return result;
}

/**
 * 移除字串前後的引號
 */
function stripQuotes(str) {
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}
