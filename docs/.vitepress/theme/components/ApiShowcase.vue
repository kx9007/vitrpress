<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { apiSites } from '../../profile'
import { highlightBash, highlightAuto } from '../highlight'

type Status = 'online' | 'unstable' | 'maintenance' | 'offline'

const STATUS_LABEL: Record<Status, string> = {
  online: '正常',
  unstable: '不稳定',
  maintenance: '维护中',
  offline: '已下线',
}

/* ---------- 分类筛选 ---------- */
const activeCat = ref('全部')
const categories = computed(() => [
  '全部',
  ...Array.from(new Set(apiSites.map((s) => s.category))),
])

const filtered = computed(() =>
  activeCat.value === '全部'
    ? apiSites
    : apiSites.filter((s) => s.category === activeCat.value)
)

const countOf = (cat: string) =>
  cat === '全部' ? apiSites.length : apiSites.filter((s) => s.category === cat).length

/* ---------- 接口文档：弹窗 ---------- */

/**
 * 当前打开的站点（null 表示关闭）。
 *
 * 原来是在卡片里就地展开，问题是：
 *   - 两列网格下单卡只有 337px，参数表挤得要横向滚动
 *   - 展开后页面被拉得很长，其他站点被推得老远
 * 改成弹窗后内容有整屏宽度可用，也不再影响列表布局。
 */
const activeSite = ref<(typeof apiSites)[number] | null>(null)

/** 弹窗是否全屏 */
const isFullscreen = ref(false)

/** 复制反馈：用「文本指纹 + 类型」做 key，避免所有按钮一起闪 */
const copiedKey = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 滚动锁。
 *
 * 用 body.overflow 直接改写会踩两个坑：
 *   1. 路由切换时组件被卸载，onBeforeUnmount 里的恢复时机不可靠，
 *      实测切到别的页面后 body 仍留着 overflow: hidden，整页滚不动，
 *      表现就是"点了导航没反应"。
 *   2. 直接赋值 '' 会抹掉其他代码可能设置的 overflow 值。
 *
 * 改为给 <html> 打一个类，样式层控制，卸载时无条件移除。
 */
function lockScroll() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.add('doc-open')
}

function unlockScroll() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.remove('doc-open')
}

function openDoc(site: (typeof apiSites)[number]) {
  activeSite.value = site
  isFullscreen.value = false
  lockScroll()
}

function closeDoc() {
  activeSite.value = null
  isFullscreen.value = false
  unlockScroll()
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

/**
 * 在新页面打开。
 *
 * 把当前站点的文档序列化成一段独立 HTML，
 * 用 Blob 生成临时地址再 window.open。
 * 这样新页面不依赖 SPA 路由，刷新也不会丢。
 */
function openInNewTab(site: (typeof apiSites)[number]) {
  if (typeof window === 'undefined') return

  const esc = (t: string) =>
    t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const eps = (site.endpoints || [])
    .map((ep) => {
      const rows = (ep.params || [])
        .map(
          (pm) => `<tr>
            <td><code>${esc(pm.name)}</code></td>
            <td>${esc(pm.type)}</td>
            <td>${pm.required ? '<b class="req">必填</b>' : '可选'}</td>
            <td>${esc(pm.desc)}</td>
          </tr>`
        )
        .join('')

      return `<section class="ep">
        <h2><span class="m m-${ep.method.toLowerCase()}">${ep.method}</span><code>${esc(ep.path)}</code></h2>
        <p class="desc">${esc(ep.desc)}</p>
        <p class="url"><code>${esc(site.baseUrl)}${esc(ep.path)}</code></p>
        ${
          rows
            ? `<h3>请求参数</h3><table><thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead><tbody>${rows}</tbody></table>`
            : '<p class="none">该接口无需请求参数。</p>'
        }
        <h3>cURL 示例</h3>
        <pre><code>${highlightBash(curlOf(site, ep))}</code></pre>
        <h3>返回示例</h3>
        <pre><code>${highlightAuto(ep.response)}</code></pre>
      </section>`
    })
    .join('')

  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(site.name)} · 接口文档</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;padding:32px 20px;font:15px/1.7 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif;
       max-width:900px;margin:0 auto;color:#1f2328;background:#fff}
  @media (prefers-color-scheme:dark){body{color:#e6edf3;background:#0d1117}}
  h1{font-size:24px;margin:0 0 6px}
  .meta{color:#6b7280;font-size:13px;margin-bottom:24px}
  .base{font-family:ui-monospace,monospace;font-size:13px;padding:8px 12px;
        border:1px solid #d0d7de;border-radius:8px;display:inline-block;margin-bottom:8px}
  @media (prefers-color-scheme:dark){.base{border-color:#30363d}}
  .ep{padding:20px 0;border-top:1px solid #d0d7de}
  @media (prefers-color-scheme:dark){.ep{border-color:#30363d}}
  h2{display:flex;align-items:center;gap:10px;font-size:16px;margin:0 0 8px;font-family:ui-monospace,monospace}
  h3{font-size:12px;letter-spacing:.04em;color:#6b7280;margin:18px 0 8px;font-weight:600}
  .m{padding:2px 8px;border-radius:5px;font-size:11px;font-weight:700;font-family:ui-monospace,monospace}
  .m-get{background:#d7f5e0;color:#147a3d}
  .m-post{background:#dbeafe;color:#1a5fb4}
  .m-put{background:#fef3c7;color:#9a6a00}
  .m-delete{background:#fee2e2;color:#b8272c}
  @media (prefers-color-scheme:dark){
    .m-get{background:#12351f;color:#6ee7a0}
    .m-post{background:#12243a;color:#79befe}
    .m-put{background:#332a08;color:#f2cf5a}
    .m-delete{background:#3a1417;color:#f66f81}
  }
  .desc{color:#57606a;margin:0}
  @media (prefers-color-scheme:dark){.desc{color:#8b949e}}
  .url{margin:6px 0 0;font-size:12.5px;color:#6b7280}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
  th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #d0d7de;vertical-align:top}
  @media (prefers-color-scheme:dark){th,td{border-color:#30363d}}
  th{font-size:12px;color:#6b7280;font-weight:600}
  code{font-family:ui-monospace,monospace;font-size:12.5px}
  .req{color:#b8272c}
  .none{color:#6b7280;font-size:13px}
  pre{padding:14px;border-radius:8px;overflow-x:auto;font-size:12.5px;line-height:1.65;
      background:#f6f8fa;border:1px solid #d0d7de;margin:8px 0 0}
  @media (prefers-color-scheme:dark){pre{background:#161b22;border-color:#30363d}}
  /* 代码高亮：与弹窗、正文 Markdown 用同一套 github 色板 */
  .tk-k{color:#6f42c1}
  .tk-f{color:#d73a49}
  .tk-s,.tk-s2{color:#032f62}
  .tk-n,.tk-l{color:#005cc5}
  .tk-c{color:#6a737d;font-style:italic}
  .tk-v{color:#e36209}
  .tk-u{color:#005cc5}
  .tk-b{color:#005cc5;font-weight:600}
  @media (prefers-color-scheme:dark){
    .tk-k{color:#d2a8ff}
    .tk-f{color:#f97583}
    .tk-s,.tk-s2{color:#9ecbff}
    .tk-n,.tk-l{color:#79b8ff}
    .tk-c{color:#8b949e}
    .tk-v{color:#ffab70}
    .tk-u{color:#79b8ff}
    .tk-b{color:#79b8ff}
  }
</style></head>
<body>
  <h1>${esc(site.name)}</h1>
  <p class="meta">${esc(site.desc)}</p>
  <div class="base">${esc(site.baseUrl)}</div>
  <p class="meta">计费：${esc(site.pricing)} · 模型：${esc(site.models.join(' / '))}</p>
  ${eps}
</body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  // 给浏览器一点时间加载完再释放
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/**
 * 复制文本。
 *
 * 用「内容指纹 + 用途」做 key，这样同一段代码里的
 * 响应体和 curl 可以分别显示"已复制"，互不干扰。
 */
async function copyText(text: string, key: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copiedKey.value = null), 1800)
  } catch {
    copiedKey.value = null
  }
}

/**
 * 生成一段可直接运行的 curl 示例。
 * 让文档不只可读，还能立刻拿去试。
 *
 * 两处细节按真实接口改正过：
 *   1. 只有站点声明了 `auth: true` 才带 Authorization 头。
 *      api.kxlove.top 的接口全部免密钥，之前无脑加 Bearer 会误导人。
 *   2. GET 把必填参数拼进 query string。
 *      原来 GET 分支什么都不加，示例命令等于没传参、必然报错。
 */
function curlOf(site: (typeof apiSites)[number] & { auth?: boolean }, ep: any) {
  const params = ep.params || []

  // GET：必填参数拼到 query 上
  let target = `${site.baseUrl}${ep.path}`
  if (ep.method === 'GET') {
    const qs = params
      .filter((pm: any) => pm.required)
      .map((pm: any) => `${pm.name}=${encodeQuery(pm)}`)
      .join('&')
    if (qs) target += `?${qs}`
  }

  const lines = [`curl -X ${ep.method} '${target}'`]
  if (site.auth) lines.push(`  -H 'Authorization: Bearer $API_KEY'`)

  // 含 file 参数的是 multipart 上传，要用 -F 而不是 JSON body
  const isMultipart = params.some((pm: any) => pm.type === 'file')

  if (isMultipart) {
    for (const pm of params) {
      if (!pm.required) continue
      const val =
        pm.type === 'file'
          ? '@/path/to/audio.mp3'
          : pm.type === 'boolean'
            ? 'true'
            : pm.type === 'integer' || pm.type === 'number'
              ? '0'
              : `your_${pm.name}`
      lines.push(`  -F '${pm.name}=${val}'`)
    }
  } else if (ep.method !== 'GET') {
    lines.push(`  -H 'Content-Type: application/json'`)
    const body: Record<string, unknown> = {}
    for (const pm of params) {
      if (!pm.required) continue
      body[pm.name] =
        pm.type === 'string'
          ? `your_${pm.name}`
          : pm.type === 'boolean'
            ? 'true'
            : pm.type === 'integer' || pm.type === 'number'
              ? '0'
              : pm.type === 'Message[]'
                ? [{ role: 'user', content: '你好' }]
                : '[...]'
    }
    // JSON 体内每行再多缩进两格，与 -d 对齐后再收尾
    const json = JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')
    lines.push(`  -d '${json}'`)
  }
  return lines.join(' \\' + '\n')
}

/** GET 参数占位值：拿参数的 example 提示，没有就给一个同类型的占位 */
function encodeQuery(pm: any): string {
  if (pm.desc && /链接|URL/i.test(pm.desc)) return 'https%3A%2F%2Fexample.com%2Fxxx'
  return `your_${pm.name}`
}

/** 方法配色：GET 绿色、POST 蓝色，其余中性 */
const METHOD_CLASS: Record<string, string> = {
  GET: 'method--get',
  POST: 'method--post',
  PUT: 'method--put',
  DELETE: 'method--delete',
}

/** 键盘：Esc 关闭弹窗 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && activeSite.value) {
    if (isFullscreen.value) isFullscreen.value = false
    else closeDoc()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKeydown)
}

/*
 * 路由一变就无条件关弹窗 + 解锁。
 *
 * 用户的实际操作是先点「接口文档」再点顶部导航。
 * 弹窗的遮罩铺满视口（z-index 200，高于导航栏），
 * 这时点导航其实点在遮罩上，等于没反应。
 * 所以只要路径变化，就先把弹窗收掉，保证导航永远可用。
 */
let lastPath = ''
let routeTimer: number | undefined

function onRouteChange() {
  if (typeof window === 'undefined') return
  const p = window.location.pathname
  if (p === lastPath) return
  lastPath = p
  if (activeSite.value) {
    activeSite.value = null
    isFullscreen.value = false
  }
  unlockScroll()
}

onMounted(() => {
  lastPath = window.location.pathname
  // VitePress 路由变化不一定触发 popstate，用轮询兜底最可靠
  routeTimer = window.setInterval(onRouteChange, 180)
})

/*
 * 路由离开时一定要解锁。
 *
 * 弹窗还开着就切走页面，组件会被直接卸载，
 * closeDoc 不会被调用 —— 这是之前"切到别的页滚不动"的直接原因。
 * 这里兜底，加上 unlockScroll 幂等（只删类），重复调用无害。
 */
onBeforeUnmount(() => {
  /*
   * 顺序很重要：先解锁，再做其它清理。
   *
   * 这里原来第一行是 `if (timer) clearTimeout(timer)`，
   * 但组件里从未声明过 timer —— 那是个早先版本留下的死引用。
   * 结果是每次离开 API 页都会抛 ReferenceError: timer is not defined，
   * 而且抛在函数第一行：后面的 clearInterval / removeEventListener /
   * unlockScroll 全部被跳过。
   *
   * 后果比"少清一个定时器"严重得多：
   *   1. html.doc-open 留在 <html> 上，全站被 overflow: hidden 锁死滚不动；
   *   2. routeTimer 轮询、keydown 监听随每次进出 API 页不断累加；
   *   3. 卸载时的异常会打断 Vue 的补丁流程，新页面的挂载可能被影响，
   *      表现就是"点了导航没反应、切不过去"。
   *
   * 所以：解锁放最前，且每一步都不依赖前面的步骤成功。
   */
  unlockScroll()
  if (copyTimer) clearTimeout(copyTimer)
  if (routeTimer) clearInterval(routeTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})

/* ---------- 统计 ---------- */
const onlineCount = computed(
  () => apiSites.filter((s) => s.status === 'online').length
)
</script>

<template>
  <div class="apis">
    <!-- 概览 -->
    <div class="apis__summary">
      <div class="sum">
        <strong>{{ apiSites.length }}</strong>
        <span>个站点</span>
      </div>
      <div class="sum">
        <strong>{{ onlineCount }}</strong>
        <span>正常运行</span>
      </div>
      <div class="sum">
        <strong>{{ categories.length - 1 }}</strong>
        <span>个分类</span>
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="filters" role="tablist" aria-label="按分类筛选">
      <button
        v-for="cat in categories"
        :key="cat"
        type="button"
        role="tab"
        class="filter"
        :class="{ 'is-active': activeCat === cat }"
        :aria-selected="activeCat === cat"
        @click="activeCat = cat"
      >
        {{ cat }}
        <span class="filter__count">{{ countOf(cat) }}</span>
      </button>
    </div>

    <!-- 站点卡片 -->
    <div class="cards">
      <article
        v-for="s in filtered"
        :key="s.name"
        class="api lg-glass"
        :class="{ 'api--featured': s.featured }"
      >
        <header class="api__head">
          <h3 class="api__name">
            {{ s.name }}
            <span v-if="s.featured" class="api__star" title="常用"><svg class="star-icon" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95Z" fill="currentColor"/></svg></span>
          </h3>
          <span class="api__status" :class="`api__status--${s.status}`">
            <i class="api__dot" />
            {{ STATUS_LABEL[s.status as Status] }}
          </span>
        </header>

        <p class="api__desc">{{ s.desc }}</p>

        <!-- Base URL -->
        <div class="api__url">
          <code>{{ s.baseUrl }}</code>
          <button
            type="button"
            class="api__copy"
            :class="{ 'is-copied': copiedKey === `card-${s.name}` }"
            :aria-label="`复制 ${s.name} 的 Base URL`"
            @click="copyText(s.baseUrl, `card-${s.name}`)"
          >
            {{ copiedKey === `card-${s.name}` ? '已复制' : '复制' }}
          </button>
        </div>

        <!-- 模型 -->
        <div class="api__models">
          <span v-for="m in s.models" :key="m" class="chip">{{ m }}</span>
        </div>

        <!--
          接口文档：折叠区。
          默认收起，点按钮展开——6 个站点全展开会把页面拉得很长。
        -->
        <!-- 打开接口文档弹窗 -->
        <button
          v-if="s.endpoints?.length"
          type="button"
          class="api__docbtn"
          :aria-label="`查看 ${s.name} 的接口文档`"
          @click="openDoc(s)"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
            <path
              d="M3 2.5h6.5L13 6v7.5H3z M9.5 2.5V6H13"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linejoin="round"
            />
          </svg>
          接口文档
          <span class="api__doccount">{{ s.endpoints.length }}</span>
        </button>

        <footer class="api__foot">
          <span class="api__meta">{{ s.pricing }}</span>
          <a
            class="api__link"
            :href="s.url"
            target="_blank"
            rel="noreferrer noopener"
          >
            访问站点 <span aria-hidden="true">↗</span>
          </a>
          <a
            v-if="s.docs"
            class="api__link api__link--muted"
            :href="s.docs"
            target="_blank"
            rel="noreferrer noopener"
          >
            文档
          </a>
        </footer>
      </article>
    </div>

    <p v-if="!filtered.length" class="apis__empty">该分类下暂无站点。</p>

    <!-- ============ 接口文档弹窗 ============ -->
    <Teleport to="body">
      <Transition name="doc">
        <div
          v-if="activeSite"
          class="doc"
          :class="{ 'is-full': isFullscreen }"
          role="dialog"
          aria-modal="true"
          :aria-label="`${activeSite.name} 的接口文档`"
        >
          <!-- 遮罩：点击关闭 -->
          <div class="doc__backdrop" @click="closeDoc" />

          <div class="doc__panel">
            <!-- 顶栏 -->
            <header class="doc__bar">
              <div class="doc__title">
                <span
                  class="doc__status"
                  :class="`doc__status--${activeSite.status}`"
                />
                <h2>{{ activeSite.name }}</h2>
                <span class="doc__badge">{{ activeSite.endpoints?.length }} 个接口</span>
              </div>

              <div class="doc__actions">
                <button
                  type="button"
                  class="doc__icon"
                  :title="isFullscreen ? '退出全屏' : '全屏查看'"
                  :aria-label="isFullscreen ? '退出全屏' : '全屏查看'"
                  @click="toggleFullscreen"
                >
                  <svg v-if="!isFullscreen" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                    <path d="M6 2H2v4 M10 2h4v4 M14 10v4h-4 M2 10v4h4"
                          fill="none" stroke="currentColor" stroke-width="1.6"
                          stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg v-else viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                    <path d="M2 6h4V2 M14 6h-4V2 M10 14v-4h4 M6 14v-4H2"
                          fill="none" stroke="currentColor" stroke-width="1.6"
                          stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  class="doc__icon"
                  title="在新页面打开"
                  aria-label="在新页面打开"
                  @click="openInNewTab(activeSite)"
                >
                  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                    <path d="M9 2h5v5 M14 2 7.5 8.5 M12 9.5V14H2V4h4.5"
                          fill="none" stroke="currentColor" stroke-width="1.6"
                          stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  class="doc__icon doc__icon--close"
                  title="关闭（Esc）"
                  aria-label="关闭"
                  @click="closeDoc"
                >
                  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8"
                          fill="none" stroke="currentColor" stroke-width="1.7"
                          stroke-linecap="round" />
                  </svg>
                </button>
              </div>
            </header>

            <!-- 内容区 -->
            <div class="doc__body">
              <!-- 站点概要 -->
              <div class="doc__meta">
                <p class="doc__desc">{{ activeSite.desc }}</p>

                <div class="doc__baserow">
                  <code class="doc__base">{{ activeSite.baseUrl }}</code>
                  <button
                    type="button"
                    class="doc__copy doc__copy--sm"
                    @click="copyText(activeSite.baseUrl, 'base')"
                  >
                    {{ copiedKey === 'base' ? '已复制' : '复制' }}
                  </button>
                </div>

                <div class="doc__chips">
                  <span class="doc__chip">{{ activeSite.pricing }}</span>
                  <span
                    v-for="m in activeSite.models"
                    :key="m"
                    class="doc__chip doc__chip--model"
                  >
                    {{ m }}
                  </span>
                </div>
              </div>

              <!-- 逐个接口 -->
              <section
                v-for="(ep, ei) in activeSite.endpoints"
                :key="ep.method + ep.path + ei"
                class="doc__ep"
              >
                <div class="doc__ephead">
                  <span class="method" :class="METHOD_CLASS[ep.method] || 'method--other'">
                    {{ ep.method }}
                  </span>
                  <code class="doc__eppath">{{ ep.path }}</code>
                  <button
                    type="button"
                    class="doc__copy doc__copy--sm"
                    @click="copyText(`${activeSite.baseUrl}${ep.path}`, `url-${ei}`)"
                  >
                    {{ copiedKey === `url-${ei}` ? '已复制' : '复制 URL' }}
                  </button>
                </div>

                <p class="doc__epdesc">{{ ep.desc }}</p>

                <!-- 参数表 -->
                <template v-if="ep.params?.length">
                  <h3 class="doc__h3">请求参数</h3>
                  <div class="doc__tablewrap">
                    <table class="doc__table">
                      <thead>
                        <tr>
                          <th>参数名</th>
                          <th>类型</th>
                          <th>必填</th>
                          <th>说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="pm in ep.params" :key="pm.name">
                          <td data-label="参数名"><code>{{ pm.name }}</code></td>
                          <td data-label="类型"><span class="doc__type">{{ pm.type }}</span></td>
                          <td data-label="必填">
                            <span class="doc__req" :class="{ 'is-required': pm.required }">
                              {{ pm.required ? '必填' : '可选' }}
                            </span>
                          </td>
                          <td data-label="说明" class="doc__pdesc">{{ pm.desc }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </template>
                <p v-else class="doc__noparam">该接口无需请求参数。</p>

                <!-- cURL 示例 -->
                <div class="doc__codeblock">
                  <div class="doc__codebar">
                    <span class="doc__codelabel">cURL</span>
                    <button
                      type="button"
                      class="doc__copy doc__copy--sm"
                      @click="copyText(curlOf(activeSite, ep), `curl-${ei}`)"
                    >
                      {{ copiedKey === `curl-${ei}` ? '已复制' : '复制' }}
                    </button>
                  </div>
                  <pre class="doc__pre"><code v-html="highlightBash(curlOf(activeSite, ep))" /></pre>
                </div>

                <!-- 返回示例 -->
                <div class="doc__codeblock">
                  <div class="doc__codebar">
                    <span class="doc__codelabel">返回示例</span>
                    <button
                      type="button"
                      class="doc__copy doc__copy--sm"
                      @click="copyText(ep.response, `resp-${ei}`)"
                    >
                      {{ copiedKey === `resp-${ei}` ? '已复制' : '复制' }}
                    </button>
                  </div>
                  <pre class="doc__pre"><code v-html="highlightAuto(ep.response)" /></pre>
                </div>
              </section>
            </div>

            <!-- 底栏 -->
            <footer class="doc__foot">
              <span class="doc__hint">按 Esc 关闭 · 支持全屏 / 新页面查看</span>
              <a
                v-if="activeSite.docs"
                class="doc__link"
                :href="activeSite.docs"
                target="_blank"
                rel="noreferrer noopener"
              >
                官方文档 <span aria-hidden="true">↗</span>
              </a>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.apis {
  margin: 8px 0 24px;
}

/* ---------- 接口文档 ---------- */

.api__docwrap {
  margin-top: 4px;
}

/* 展开按钮 */
.api__doctoggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 2px;
  font: inherit;
  font-size: 12.5px;
  font-weight: 560;
  color: var(--vp-c-brand-1);
  background: none;
  border: 0;
  cursor: pointer;
  transition: opacity 0.22s ease;
}

.api__doctoggle:hover {
  opacity: 0.75;
}

.api__doccaret {
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.api__doccaret.is-open {
  transform: rotate(180deg);
}

.api__doccount {
  font-weight: 400;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

/* 文档容器 */
.api__docs {
  margin-top: 10px;
  padding-top: 14px;
  border-top: 1px dashed var(--vp-c-divider);
}

.api__ep + .api__ep {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--vp-c-divider);
}

/* 方法 + 路径 */
.api__ephead {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.method {
  flex: 0 0 auto;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border-radius: 5px;
  font-family: var(--vp-font-family-mono);
}

.method--get {
  color: #147a3d;
  background: rgba(48, 209, 88, 0.16);
}

.method--post {
  color: #1a5fb4;
  background: rgba(10, 132, 255, 0.16);
}

.method--put {
  color: #9a6a00;
  background: rgba(255, 214, 10, 0.18);
}

.method--delete {
  color: #b8272c;
  background: rgba(244, 63, 94, 0.16);
}

.method--other {
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
}

.dark .method--get { color: #6ee7a0; }
.dark .method--post { color: #79befe; }
.dark .method--put { color: #f2cf5a; }
.dark .method--delete { color: #f66f81; }

.api__eppath {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-1);
  background: none;
  padding: 0;
}

.api__epdesc {
  margin: 8px 0 0;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

.api__blocktitle {
  margin: 14px 0 7px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
}

/*
 * 参数表：窄屏可横向滚动，不能把整页撑宽。
 *
 * 关键约束：
 *   - 外层 max-width: 100%，且 overflow-x: auto
 *   - 表格设 min-width，让它溢出容器而不是压扁内容
 * 少任何一个都会导致 body 被撑出横向滚动条。
 */
.api__tablewrap {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
}

/*
 * 桌面端是两列网格，单卡宽度只有 340px 左右。
 * 四列平分会把"说明"列压成十几个字宽、频繁截断，
 * 所以给各列指定明确比例：说明列拿大头，其余按内容收缩。
 */
.api__table {
  width: 100%;
  min-width: 380px;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

.api__table th:nth-child(1),
.api__table td:nth-child(1) {
  width: 26%;
}

.api__table th:nth-child(2),
.api__table td:nth-child(2) {
  width: 20%;
}

.api__table th:nth-child(3),
.api__table td:nth-child(3) {
  width: 14%;
}

.api__table th:nth-child(4),
.api__table td:nth-child(4) {
  width: 40%;
}

.api__table th {
  padding: 7px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.api__table td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: top;
}

.api__table tr:last-child td {
  border-bottom: 0;
}

.api__table code {
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--vp-c-text-1);
  background: none;
  padding: 0;
}

.api__type {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--vp-c-brand-1);
  white-space: nowrap;
}

.api__req {
  font-size: 11px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.api__req.is-required {
  color: #d5393e;
  font-weight: 600;
}

.dark .api__req.is-required {
  color: #ff8a8a;
}

.api__pdesc {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  /* 表格用 fixed 布局后必须允许换行，否则会被裁掉 */
  word-break: break-word;
  overflow-wrap: anywhere;
}

.api__noparam {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

/* 返回示例 */
.api__resp {
  margin: 0;
  max-width: 100%;
  padding: 11px 13px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  white-space: pre;
}

.api__resp code {
  font-family: inherit;
  background: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
  /* 长行不换行，但只在 pre 内部横向滚动，不撑破卡片 */
  white-space: pre;
}

/* ---------- 概览 ---------- */
.apis__summary {
  display: flex;
  gap: 10px;
  margin-bottom: 22px;
}

.sum {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 9px 16px;
  background: var(--hp-card-bg);
  border: var(--hp-border);
  border-radius: 8px;
}

.sum strong {
  font-size: 19px;
  font-weight: 720;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-1);
}

.sum span {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

/* ---------- 筛选 ---------- */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  font: inherit;
  font-size: 13px;
  font-weight: 540;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
  border: var(--hp-border);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.4, 0.8, 0.4, 1);
}

.filter:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-2);
}

.filter.is-active {
  color: #fff;
  background: var(--accent-grad, var(--vp-c-brand-1));
  border-color: transparent;
  box-shadow: 0 6px 16px -8px var(--accent-glow, rgba(0, 0, 0, 0.3));
}

.filter__count {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  opacity: 0.62;
}

/* ---------- 卡片 ---------- */
/*
 * 关键：用 minmax(0, 1fr) 而不是 1fr。
 *
 * 1fr 的隐含最小值是 auto，会被卡片里的参数表、pre 代码块撑开——
 * 实测手机宽度 390px 时卡片被撑到 555px，整页出现横向滚动条。
 * minmax(0, 1fr) 显式允许收缩到 0，内容再宽也只在容器内部滚动。
 *
 * 列数不写死：auto-fill + 最小列宽，由容器宽度决定放几列。
 * 1280px 屏能排 3 列，超宽屏 4 列，平板 2 列，手机 1 列。
 * 用 min(100%, 310px) 是为了窄屏时列宽不被 310px 顶出去。
 */
.cards {
  display: grid;
  /*
   * 310px 是能放下「Base URL + 复制按钮 + 模型 chips」的舒适下限。
   * 保留右侧大纲时正文区约 896px，896 - 14(gap) 后两列各约 441px，
   * 三列会被压到 289px：URL 被省略号截断、多模型 chips 折成两行、按钮挤成窄条。
   * 所以这一页刻意只排两列，宁可列少也要卡片内容舒展。
   */
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 310px), 1fr));
  gap: 14px;
  /* 行内等高：卡片底部按钮位置才会齐 */
  align-items: stretch;
}

.api {
  display: flex;
  flex-direction: column;
  /* grid 子项默认 min-width: auto，会被内部宽内容撑开 */
  min-width: 0;
  padding: 20px;
  border-radius: 8px;
  /* hover 的鼓胀感由全局 .lg-glass--interactive 统一控制，
     这里不再单独位移，避免和液态玻璃效果打架 */
}

.dark .api {
}

.api__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.api__name {
  margin: 0;
  font-size: 15.5px;
  font-weight: 660;
  letter-spacing: -0.01em;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}

.api__star {
  display: inline-flex;
  align-items: center;
  margin-left: 5px;
  color: var(--rb-3);
}

.api__star :deep(.star-icon) {
  display: block;
}

/* 状态徽标 */
.api__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
  padding: 3px 9px;
  font-size: 11.5px;
  font-weight: 560;
  border-radius: 999px;
  white-space: nowrap;
}

.api__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.api__status--online {
  color: #14803c;
  background: rgba(48, 209, 88, 0.14);
}
.api__status--unstable {
  color: #9a6a00;
  background: rgba(255, 214, 10, 0.18);
}
.api__status--maintenance {
  color: #1a5fb4;
  background: rgba(10, 132, 255, 0.14);
}
.api__status--offline {
  color: #8b8f99;
  background: rgba(128, 128, 160, 0.16);
}

.dark .api__status--online {
  color: #6ee7a0;
  background: rgba(48, 209, 88, 0.18);
}
.dark .api__status--unstable {
  color: #f2cf5a;
  background: rgba(255, 214, 10, 0.16);
}
.dark .api__status--maintenance {
  color: #79befe;
  background: rgba(10, 132, 255, 0.2);
}
.dark .api__status--offline {
  color: #a8adba;
  background: rgba(255, 255, 255, 0.1);
}

.api__desc {
  margin: 10px 0 14px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

/* Base URL 行 */
.api__url {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px 7px 11px;
  background: var(--vp-c-default-soft);
  border-radius: 10px;
}

.api__url code {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: none;
  padding: 0;
}

.api__copy {
  flex: 0 0 auto;
  padding: 3px 9px;
  font: inherit;
  font-size: 11.5px;
  font-weight: 560;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
  border: var(--hp-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.api__copy:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-2);
}

.api__copy.is-copied {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: transparent;
}

/* 模型标签 */
.api__models {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.chip {
  padding: 3px 8px;
  font-size: 11.5px;
  color: var(--vp-c-text-2);
  background: color-mix(in srgb, var(--rb-6) 10%, transparent);
  border-radius: 6px;
  white-space: nowrap;
}

/* 深色下模型标签与底部链接需要更亮，否则小字糊成一片 */
.dark .chip {
  color: var(--vp-c-text-1);
  background: color-mix(in srgb, var(--rb-6) 20%, transparent);
}

/* 底部 */
.api__foot {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 12.5px;
}

.api__meta {
  color: var(--vp-c-text-3);
}

.dark .api__meta {
  color: var(--vp-c-text-2);
}

.api__link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 540;
  transition: opacity 0.25s ease;
}

.api__link:hover {
  opacity: 0.75;
}

.api__link--muted {
  margin-left: auto;
  color: var(--vp-c-text-2);
}

.dark .api__link--muted {
  color: var(--vp-c-text-1);
  opacity: 0.85;
}

.apis__empty {
  padding: 40px 0;
  text-align: center;
  color: var(--vp-c-text-3);
}

/* ---------- 响应式 ---------- */
@media (max-width: 860px) {
  /*
   * 手机上参数表改成"每条参数一块"的堆叠布局。
   *
   * 四列表格在 390px 宽里必定放不下，只能横向拖动——
   * 能用但很难受。改成卡片后信息完整可见，不用滑动。
   * 用 data-label 把列名带进每个单元格。
   */
  .api__tablewrap {
    border: 0;
    overflow-x: visible;
  }

  .api__table,
  .api__table tbody,
  .api__table tr,
  .api__table td {
    display: block;
    width: 100%;
    min-width: 0;
  }

  /* 表头在卡片模式下没有意义 */
  .api__table thead {
    display: none;
  }

  .api__table tr {
    padding: 10px 0;
    border-bottom: 1px solid var(--vp-c-divider);
  }

  .api__table tr:last-child {
    border-bottom: 0;
  }

  .api__table td {
    display: grid;
    grid-template-columns: 62px minmax(0, 1fr);
    gap: 8px;
    padding: 3px 0;
    border: 0;
    font-size: 12px;
    line-height: 1.6;
  }

  /* 用 ::before 补出列名 */
  .api__table td::before {
    content: attr(data-label);
    font-size: 11.5px;
    color: var(--vp-c-text-3);
  }

  /* 参数名单独一行并加粗，作为这组的小标题 */
  .api__table td:first-child {
    grid-template-columns: 62px minmax(0, 1fr);
    margin-bottom: 2px;
  }

  .api__table td:first-child code {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--vp-c-brand-1);
  }
}

@media (max-width: 560px) {
  /* 只有手机上才强制单列，其余宽度都交给 auto-fill */
  .cards {
    grid-template-columns: minmax(0, 1fr);
  }

  .apis__summary {
    flex-wrap: wrap;
  }
  .sum {
    padding: 7px 12px;
  }
  .api {
    padding: 16px;
  }
  .api__head {
    flex-direction: column;
    gap: 8px;
  }
  /* 窄屏保持单行：URL 自适应收窄 + 省略号，按钮贴右且居中 */
  .api__url {
    flex-wrap: nowrap;
    gap: 6px;
    padding: 8px 8px 8px 10px;
  }
  .api__url code {
    font-size: 11px;
  }
  .api__copy {
    margin-left: 0;
    padding: 3px 8px;
  }
}

/* =========================================================
   接口文档弹窗
   ========================================================= */

.doc {
  position: fixed;
  inset: 0;
  /*
   * 层级必须低于顶部导航栏（.VPNav 是 z-index: 30）。
   * 之前设 200，遮罩把导航栏一起盖住，
   * 用户点「导航 / 博客 / 关于」其实点在遮罩上，表现为"点了没反应"。
   * 降到 20 后弹窗仍在正文之上，但导航栏保持可点，
   * 配合 onRouteChange 的自动关闭，切页行为正常。
   */
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/*
 * 弹窗打开时锁背景滚动。
 *
 * 只锁 html 的 overflow，不改 body 的内联样式：
 *   - 内联样式在路由切换时不会被框架自动清掉，
 *     实测切页后 body 仍留着 overflow: hidden，整页滚不动；
 *   - html.doc-open 是类名开关，组件卸载时 remove 一次就干净了。
 */
html.doc-open {
  overflow: hidden;
}

/* 遮罩 */
.doc__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(8, 10, 16, 0.62);
  backdrop-filter: blur(3px);
}

/* 面板 */
.doc__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(860px, 100%);
  max-height: min(84vh, 900px);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  box-shadow: 0 28px 80px -24px rgba(8, 12, 24, 0.5);
  overflow: hidden;
}

/* 全屏：铺满视口 */
.doc.is-full {
  padding: 0;
}

.doc.is-full .doc__panel {
  width: 100%;
  height: 100%;
  max-height: none;
  border-radius: 0;
  border: 0;
}

/* 全屏时正文限宽居中，避免超宽行难以阅读 */
.doc.is-full .doc__body,
.doc.is-full .doc__bar,
.doc.is-full .doc__foot {
  padding-inline: max(20px, calc((100% - 1080px) / 2));
}

/* ---------- 顶栏 ---------- */

.doc__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  padding: 14px 18px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.doc__title {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  flex: 1;
}

.doc__title h2 {
  margin: 0;
  padding: 0;
  font-size: 15px;
  font-weight: 660;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-top: 0;
}

.doc__badge {
  flex: 0 0 auto;
  padding: 2px 8px;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-soft);
  border-radius: 999px;
}

/* 状态小圆点 */
.doc__status {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.doc__status--online { background: #30d158; }
.doc__status--unstable { background: #ffd60a; }
.doc__status--maintenance { background: #0a84ff; }
.doc__status--offline { background: #8b8f99; }

/* 右上角按钮组 */
.doc__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.doc__icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: var(--vp-c-text-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.doc__icon:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-default-soft);
  border-color: var(--vp-c-divider);
}

.doc__icon--close:hover {
  color: #fff;
  background: #d5393e;
  border-color: transparent;
}

/* ---------- 内容区 ---------- */

.doc__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.doc__desc {
  margin: 0 0 12px;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--vp-c-text-2);
}

/* Base URL 一行 */
.doc__baserow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 10px 8px 12px;
  background: var(--vp-c-default-soft);
  border-radius: 8px;
}

.doc__base {
  flex: 1;
  min-width: 0;
  padding: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-1);
  background: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.doc__chip {
  padding: 3px 9px;
  font-size: 11.5px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 6px;
}

.doc__chip--model {
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
}

/* ---------- 单个接口 ---------- */

.doc__ep {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid var(--vp-c-divider);
}

.doc__ephead {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.doc__eppath {
  padding: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: none;
}

.doc__epdesc {
  margin: 9px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.doc__h3 {
  margin: 16px 0 8px;
  padding: 0;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
  border-top: 0;
}

.doc__noparam {
  margin: 12px 0 0;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

/* 参数表 */
.doc__tablewrap {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.doc__table {
  width: 100%;
  min-width: 420px;
  border-collapse: collapse;
  font-size: 12.5px;
  table-layout: fixed;
}

.doc__table th:nth-child(1), .doc__table td:nth-child(1) { width: 25%; }
.doc__table th:nth-child(2), .doc__table td:nth-child(2) { width: 20%; }
.doc__table th:nth-child(3), .doc__table td:nth-child(3) { width: 13%; }
.doc__table th:nth-child(4), .doc__table td:nth-child(4) { width: 42%; }

.doc__table th {
  padding: 8px 11px;
  font-size: 11.5px;
  font-weight: 600;
  text-align: left;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.doc__table td {
  padding: 8px 11px;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: top;
}

.doc__table tr:last-child td {
  border-bottom: 0;
}

.doc__table code {
  padding: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-1);
  background: none;
}

.doc__type {
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  color: var(--vp-c-brand-1);
}

.doc__req {
  font-size: 11.5px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.doc__req.is-required {
  color: #d5393e;
  font-weight: 600;
}

html.dark .doc__req.is-required {
  color: #ff8a8a;
}

.doc__pdesc {
  color: var(--vp-c-text-2);
  line-height: 1.65;
  word-break: break-word;
  overflow-wrap: anywhere;
}

/* ---------- 代码块 ---------- */

.doc__codeblock {
  margin-top: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.doc__codebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px 6px 12px;
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
}

.doc__codelabel {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
}

.doc__pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  background: none;
  border: 0;
  white-space: pre;
}

.doc__pre code {
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background: none;
}

/* ---------- 代码高亮配色 ----------
 * 与 VitePress 默认的 github-light / github-dark 色板对齐，
 * 这样弹窗里的代码和正文 Markdown 代码块看起来是一套。
 *
 * 必须用 :deep()：高亮结果是 v-html 插入的，
 * 不带 scoped 的 data-v 属性，普通选择器选不到。
 */
.doc__codeblock {
  --tk-keyword: #d73a49;
  --tk-string: #032f62;
  --tk-number: #005cc5;
  --tk-comment: #6a737d;
  --tk-func: #6f42c1;
  --tk-var: #e36209;
  --tk-url: #005cc5;
  --tk-builtin: #005cc5;
  /* JSON 键名单独一色：和值的深蓝拉开层次，又不抢关键字的红 */
  --tk-key: #6f42c1;
}

html.dark .doc__codeblock {
  --tk-keyword: #f97583;
  --tk-string: #9ecbff;
  --tk-number: #79b8ff;
  --tk-comment: #8b949e;
  --tk-func: #b392f0;
  --tk-var: #ffab70;
  --tk-url: #79b8ff;
  --tk-builtin: #79b8ff;
  --tk-key: #d2a8ff;
}

.doc__pre :deep(.tk-f) {
  color: var(--tk-keyword);
}

.doc__pre :deep(.tk-k) {
  color: var(--tk-key);
}

.doc__pre :deep(.tk-s),
.doc__pre :deep(.tk-s2) {
  color: var(--tk-string);
}

.doc__pre :deep(.tk-n),
.doc__pre :deep(.tk-l) {
  color: var(--tk-number);
}

.doc__pre :deep(.tk-c) {
  color: var(--tk-comment);
  font-style: italic;
}

.doc__pre :deep(.tk-v) {
  color: var(--tk-var);
}

.doc__pre :deep(.tk-u) {
  color: var(--tk-url);
}

.doc__pre :deep(.tk-b) {
  color: var(--tk-builtin);
  font-weight: 600;
}

/* ---------- 复制按钮 ---------- */

.doc__copy {
  flex: 0 0 auto;
  padding: 3px 10px;
  font: inherit;
  font-size: 11.5px;
  font-weight: 540;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.doc__copy:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.doc__copy--sm {
  padding: 2px 8px;
  font-size: 11px;
}

/* ---------- 底栏 ---------- */

.doc__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 0 0 auto;
  padding: 10px 18px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.doc__hint {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.doc__link {
  font-size: 12.5px;
  font-weight: 540;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.doc__link:hover {
  opacity: 0.75;
}

/* ---------- 进出场 ---------- */

.doc-enter-active,
.doc-leave-active {
  transition: opacity 0.24s ease;
}

.doc-enter-active .doc__panel,
.doc-leave-active .doc__panel {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.doc-enter-from,
.doc-leave-to {
  opacity: 0;
}

.doc-enter-from .doc__panel,
.doc-leave-to .doc__panel {
  transform: translateY(14px) scale(0.98);
}

/* ---------- 卡片上的文档按钮 ---------- */

.api__docbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  margin-top: 4px;
  padding: 5px 11px;
  font: inherit;
  font-size: 12.5px;
  font-weight: 540;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid transparent;
  border-radius: 7px;
  cursor: pointer;
  transition:
    background-color 0.22s ease,
    border-color 0.22s ease;
}

.api__docbtn:hover {
  border-color: var(--vp-c-brand-1);
}

.api__doccount {
  padding: 0 5px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  border-radius: 4px;
}

/* ---------- 响应式 ---------- */

@media (max-width: 640px) {
  .doc {
    padding: 0;
    align-items: flex-end;
  }

  .doc__panel {
    width: 100%;
    max-height: 92vh;
    border-radius: 16px 16px 0 0;
    border-bottom: 0;
  }

  .doc__bar {
    padding: 12px 14px;
  }

  .doc__title h2 {
    font-size: 14px;
  }

  /* 移动端图标热区放大到 34px，方便点按 */
  .doc__icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: var(--vp-c-default-soft);
  }

  .doc__bar {
    gap: 8px;
  }

  .doc__body {
    padding: 16px 14px;
  }

  /* 参数表在窄屏改成堆叠卡片，避免横向拖动 */
  .doc__tablewrap {
    border: 0;
    overflow-x: visible;
  }

  .doc__table,
  .doc__table tbody,
  .doc__table tr,
  .doc__table td {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .doc__table thead {
    display: none;
  }

  .doc__table tr {
    padding: 10px 12px;
    margin-bottom: 8px;
    background: var(--vp-c-default-soft);
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
  }

  .doc__table tr:last-child {
    margin-bottom: 0;
    border-bottom: 1px solid var(--vp-c-divider);
  }

  .doc__table td {
    display: grid;
    grid-template-columns: 62px minmax(0, 1fr);
    gap: 8px;
    padding: 3px 0;
    border: 0;
  }

  .doc__table td::before {
    content: attr(data-label);
    font-size: 11.5px;
    font-weight: 600;
    color: var(--vp-c-text-2);
  }

  .doc__foot {
    padding: 10px 14px;
  }

  /* 窄屏代码块改为折行，避免在抽屉内横向拖动 */
  .doc__pre {
    white-space: pre-wrap;
    word-break: normal;
    overflow-wrap: break-word;
    font-size: 11.5px;
  }

  .doc__hint {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .doc-enter-active,
  .doc-leave-active,
  .doc-enter-active .doc__panel,
  .doc-leave-active .doc__panel {
    transition: none;
  }
}
</style>
