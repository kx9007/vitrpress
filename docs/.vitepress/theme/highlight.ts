/**
 * 轻量代码高亮。
 *
 * 为什么不用 Shiki：
 *   Markdown 正文的代码块由 VitePress 在构建期用 Shiki 预渲染，
 *   但弹窗里的 cURL / 返回示例是运行时用模板插值拼出来的字符串，
 *   走不到 Markdown 管线。要在客户端调 Shiki 的 codeToHtml 就得
 *   额外打包一份 highlighter（几百 KB）+ 异步加载，
 *   为一个弹窗不值得。
 *
 * 所以这里手写一个逐 token 扫描器：
 *   无依赖、无异步、SSR 安全、体积可以忽略。
 *   只覆盖 cURL（bash）和 JSON 两种真实用到的语法。
 *
 * 安全：所有文本先做 HTML 转义，再包 span，
 *       不会把内容里的 < > & 当成标签解析。
 */

type Rule = { re: RegExp; cls: string; needsBoundary?: boolean }

/** HTML 转义，顺序不能变（& 必须最先） */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * bash / curl 规则。
 * 顺序即优先级：注释必须排最前，否则 `# 注释` 里的内容会被后续规则再切。
 *
 * 字符串单独用 wrapString 处理（见下），不走普通规则：
 * 因为 'https://...' 和 'Bearer $API_KEY' 整段都是字符串，
 * 直接把整段染成字符串色，URL 和变量就看不出去了。
 */
const BASH_RULES: Rule[] = [
  /* 注释必须最前：// stream: true 这类说明整行染灰 */
  { re: /^\/\/[^\n]*/, cls: 'c' },
  { re: /^#[^\n]*/, cls: 'c' },
  /* 顶层也可能直接出现成对的双引号 JSON（SSE 的 data: {..."k":...}） */
  { re: /^"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?=\s*:)/, cls: 'k' },
  { re: /^"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"/, cls: 's2' },
  { re: /^https?:\/\/[^\s'"]+/, cls: 'u' },
  { re: /^\$\{[^}]*\}/, cls: 'v' },
  { re: /^\$[A-Za-z_][A-Za-z0-9_]*/, cls: 'v' },
  { re: /^\b(?:curl|data|HTTP\/[\d.]+|GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/, cls: 'b' },
  /*
   * 旗标：只认"行首或空白之后"的 -x / --xxx。
   * 光靠正则做不到——扫描是从当前位置往后切的，
   * 拿不到前一个字符，Content-Type 里的 -Type 会被误判。
   * 所以这条规则额外要求前置条件，见 scan 里的 prevOk。
   */
  { re: /^--?[A-Za-z][\w-]*/, cls: 'f', needsBoundary: true },
  { re: /^\b(?:true|false|null)\b/, cls: 'l' },
  { re: /^-?\d+(?:\.\d+)?/, cls: 'n' },
]

/** JSON 规则：带冒号的字符串判为 key，其余判为普通字符串 */
const JSON_RULES: Rule[] = [
  { re: /^\/\/[^\n]*/, cls: 'c' },
  { re: /^"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?=\s*:)/, cls: 'k' },
  { re: /^"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"/, cls: 's' },
  { re: /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, cls: 'n' },
  { re: /^\b(?:true|false|null)\b/, cls: 'l' },
]

/**
 * 字符串内部再拆 URL 和 $变量。
 *
 * 例：'Authorization: Bearer $API_KEY'
 *   → 'Authorization: Bearer ' + $API_KEY + '
 * 引号本身留在字符串色里，中间的 URL / 变量单独上色。
 */
const INNER_RULES: Rule[] = [
  { re: /^https?:\/\/[^\s'"]+/, cls: 'u' },
  { re: /^\$\{[^}]*\}/, cls: 'v' },
  { re: /^\$[A-Za-z_][A-Za-z0-9_]*/, cls: 'v' },
  /* 外层是单引号包着的 JSON 时，内部成对的双引号串整体按 key / string 上色 */
  { re: /^"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?=\s*:)/, cls: 'k' },
  { re: /^"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"/, cls: 's2' },
  { re: /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, cls: 'n' },
  { re: /^\b(?:true|false|null)\b/, cls: 'l' },
  /* 键名 / 括号冒号这类结构符号保持默认色，不额外着色 */
]

function wrapString(q: string, body: string): string {
  // 引号 + 内部按 INNER_RULES 扫描（inner=true，避免再次拆引号）+ 收尾引号
  return `<span class="tk-s">${esc(q)}</span>${scan(body, INNER_RULES, true)}<span class="tk-s">${esc(q)}</span>`
}

/**
 * 扫描并拼接结果。
 *
 * 未命中任何规则时，把连续普通字符攒成一段再输出，
 * 避免每个字符都套一层 span（那样 DOM 会膨胀几十倍）。
 */
function scan(code: string, rules: Rule[], inner = false): string {
  let out = ''
  let plain = ''
  let i = 0

  const flush = () => {
    if (plain) {
      out += esc(plain)
      plain = ''
    }
  }

  while (i < code.length) {
    const rest = code.slice(i)
    const ch = code[i]

    let hit = false

    /*
     * 顺序很重要：先跑规则，再处理引号。
     *
     * 反过来（先引号）会踩两个坑：
     *   1. `// stream: true` 的注释被当成普通文本；
     *   2. `data: {"choices":...}` 每个 " 单独成段，键名全丢。
     * 规则表里已经放了注释、JSON key、JSON 字符串，
     * 它们能整段吃掉对应片段，轮不到引号分支。
     */
    for (const r of rules) {
      // 带边界要求的规则：只允许出现在行首或空白之后
      if (r.needsBoundary && i > 0 && !/[\s]/.test(code[i - 1])) continue

      const m = r.re.exec(rest)
      if (m && m[0].length) {
        flush()
        out += `<span class="tk-${r.cls}">${esc(m[0])}</span>`
        i += m[0].length
        hit = true
        break
      }
    }

    if (hit) continue

    /*
     * 规则没命中且当前是引号：说明是 shell 字符串（如 'Bearer $API_KEY'），
     * 整段交给 wrapString，内部再拆 URL / 变量。
     *
     * inner = true 时不进这个分支，避免嵌套拆解。
     */
    if (!inner && (ch === '"' || ch === "'")) {
      const m = /^(['"])((?:\\[\s\S]|(?!\1)[^\\])*)\1/.exec(rest)
      if (m) {
        flush()
        out += wrapString(m[1], m[2])
        i += m[0].length
        continue
      }
    }

    plain += code[i]
    i += 1
  }

  flush()
  return out
}

/**
 * 判断一段返回示例该用哪种语法。
 *
 * 实际数据里有三种形态：
 *   1. 纯 JSON                      → json
 *   2. `// 注释` 开头 + SSE / HTTP  → bash（能处理注释和 data: 行）
 *   3. 混合（注释里夹 JSON）        → bash（注释优先，JSON 部分按普通文本）
 */
function detectLang(code: string): 'json' | 'bash' {
  const t = code.trim()
  if (t.startsWith('{') || t.startsWith('[')) return 'json'
  return 'bash'
}

/** 高亮 cURL 示例 */
export function highlightBash(code: string): string {
  return scan(code, BASH_RULES)
}

/**
 * 高亮 JSON。
 *
 * 走 inner 模式：JSON 的整体结构就是成对的引号，
 * 若用普通模式，每个 " 都会触发 wrapString，
 * 键名和值会被拆成一堆孤立引号。
 */
export function highlightJson(code: string): string {
  return scan(code, JSON_RULES, true)
}

/** 按内容自动选语法，用于返回示例 */
export function highlightAuto(code: string): string {
  return detectLang(code) === 'json'
    ? highlightJson(code)
    : highlightBash(code)
}
