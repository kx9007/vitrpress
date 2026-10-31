<script setup lang="ts">
/**
 * 滚动进场 / 退场动效
 *
 * 行为：往下滑时，同一组里的元素交替从左右两侧插入；
 * 往上滑离开视口时，沿原方向反向退出，再滑回来会重新进场。
 *
 * ## 为什么用 IntersectionObserver 而不是 scroll 事件
 *   scroll 事件每帧都触发，回调里做几何计算会拖慢滚动。
 *   IntersectionObserver 由浏览器在合成线程算好再通知，代价低得多。
 *
 * ## 左右怎么分
 *   按元素在组内的序号奇偶交替：
 *   第 1 个从左边来、第 2 个从右边来，以此类推。
 *   如果按"区块"分，大段文字从侧面飞进来会显得很飘，
 *   所以整块内容（.home-section 之类）只做小幅位移，
 *   组内的小卡片才走完整幅度。
 *
 * ## 退出时为什么不是对称的
 *   真实物理里物体出去会加速。用 ease-in 的曲线，
 *   进场用 ease-out（快进慢收），手感才对。
 */
import { onBeforeUnmount, onMounted } from 'vue'

let io: IntersectionObserver | null = null
let stopped = false

/**
 * 容器：它自己不参与动效，而是把子元素逐个交替送入
 */
const CONTAINERS = [
  { sel: '.home-section', child: ':scope > *' },
  { sel: '.navgroup', child: ':scope > .site' },
  { sel: '.cards', child: ':scope > .api' },
  { sel: '.vp-doc', child: ':scope > *' },

  /*
   * 下面是"二级容器"：.post 在 .posts 里、.contact 在 .contacts 里，
   * 都不是 .home-section 的直接子元素，靠上一层的 :scope > * 选不到。
   * 单独列出来，让它们也能拿到递增的序号。
   */
  { sel: '.posts', child: ':scope > .post' },
  { sel: '.contacts', child: ':scope > .contact' },
]

/**
 * 独立元素：不在任何容器内的零散节点。
 *
 * 注意这里**不包含** .post / .contact ——
 * 它们是 .home-section 的子元素，由容器统一编号；
 * 若再放进这里，会被 prepare 第二次并把序号重置成 0，
 * 于是整排元素都从左边来，左右交替失效。
 */
const SINGLES = ['.site', '.api']

const SELECTOR = [
  ...CONTAINERS.map((c) => c.sel),
  ...SINGLES,
].join(',')

/** 已经接管过的元素，避免重复绑定 */
const seen = new WeakSet<HTMLElement>()

/** 网格类容器里的元素，位移幅度要小一点，不然会飞出屏幕 */
function magnitude(el: HTMLElement): 'full' | 'soft' {
  // 整块 section 只做小幅位移；卡片走完整幅度
  if (el.matches('.home-section, .vp-doc > *')) return 'soft'
  return 'full'
}

function prepare(el: HTMLElement, indexInGroup: number, soft: boolean) {
  if (seen.has(el)) return
  seen.add(el)

  // 记录序号给 CSS 用（决定左右 + 延迟）
  el.style.setProperty('--reveal-i', String(indexInGroup))

  // 左右交替：偶数从左、奇数从右
  const dir = indexInGroup % 2 === 0 ? 'left' : 'right'
  el.dataset.revealDir = dir
  el.dataset.revealMag = soft ? 'soft' : 'full'

  el.classList.add('rv')
  el.classList.add('rv-out') // 初始视为"在外面"

  io!.observe(el)
}

function scan() {
  if (!io) return

  /*
   * 处理顺序：先容器、后独立元素。
   *
   * 关键点：容器会把「自己」和「所有子元素」都记进 seen，
   * 后面处理独立元素时看到 seen 就跳过——
   * 否则同一个 .post 会被 prepare 两次，
   * 第二次把 --reveal-i 重置成 0，左右交替就全废了。
   */

  /*
   * 容器按"由内到外"的顺序处理。
   *
   * 为什么顺序重要：.posts 既是 .home-section 的子元素（会被上一层接管），
   * 又是 .post 的父容器。如果先处理外层，.posts 进了 seen，
   * 后面轮到它当容器时就被跳过，里面的 .post 永远拿不到序号。
   * 所以这里把嵌套更深的容器排在前面，先给叶子层编号。
   */
  const containers = [...CONTAINERS].sort((a, b) => {
    // 选择器层级越深（含空格/句点少），越靠前处理
    const depth = (sel: string) => document.querySelectorAll(sel).length
    return depth(a.sel) - depth(b.sel)
  })

  for (const cfg of containers) {
    document.querySelectorAll<HTMLElement>(cfg.sel).forEach((root) => {
      const kids = [...root.querySelectorAll<HTMLElement>(cfg.child)]
      if (!kids.length) return

      /*
       * 即使容器自己已经被上层接管，也要继续给它的子元素编号——
       * 只是跳过重复的 seen 标记，不跳过子元素处理。
       */
      const pending = kids.filter((k) => !seen.has(k))
      if (pending.length) pending.forEach((k, i) => prepare(k, i, false))

      if (!seen.has(root)) {
        seen.add(root)
        io!.observe(root)
      }
    })
  }

  for (const sel of SINGLES) {
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (seen.has(el)) return
      prepare(el, 0, magnitude(el) === 'soft')
    })
  }
}

function onScan() {
  if (!stopped) scan()
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stopped = true
    return
  }

  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement
        const cfg = CONTAINERS.find((c) => el.matches(c.sel))

        /*
         * 容器：把状态一次性传给「已经接管的子元素」。
         *
         * 注意要用 .rv 过滤——容器里有些子元素（比如纯装饰的 div）
         * 并没有被 prepare 过，给它们加 rv-out 会莫名其妙消失。
         */
        if (cfg) {
          const kids = [
            ...el.querySelectorAll<HTMLElement>(cfg.child),
          ].filter((k) => k.classList.contains('rv'))
          if (kids.length) {
            kids.forEach((k) => k.classList.toggle('rv-out', !e.isIntersecting))
            continue
          }
        }

        // 独立元素：进入 → 移除 rv-out；离开 → 加回
        if (el.classList.contains('rv')) {
          el.classList.toggle('rv-out', !e.isIntersecting)
        }
      }
    },
    {
      // 底部提前 6% 触发，让动画在完全进入前就开始，观感更顺
      rootMargin: '0px 0px -6% 0px',
      threshold: 0.05,
    }
  )

  requestAnimationFrame(() => scan())
  document.addEventListener('scan-reveal', onScan)
})

onBeforeUnmount(() => {
  document.removeEventListener('scan-reveal', onScan)
  io?.disconnect()
})
</script>

<template>
  <span class="rv-marker" aria-hidden="true" />
</template>

<style>
/*
 * 不能用 scoped：要作用到其他组件渲染出来的元素上。
 */

/* ---------- 基础状态 ---------- */

/*
 * 注意优先级：
 * 业务组件里给 .contact / .post 之类的元素写过自己的 transition
 * （只针对 background-color / border-color），
 * 而本文件是普通样式，同优先级下后加载的会赢。
 * 这里用 html .rv 抬高一级，确保 opacity / transform 的过渡生效，
 * 否则会出现"元素瞬间跳到位、完全没有动画"。
 */
html body #app .rv, html body .rv {
  opacity: 1;
  /* 进场：快进慢收，落位有"刹车"感 */
  transition-property: opacity, transform, background-color, border-color !important;
  transition-duration: 0.62s, 0.78s, 0.25s, 0.25s !important;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1), cubic-bezier(0.16, 1, 0.3, 1), ease, ease !important;
  transition-delay: calc(var(--reveal-i, 0) * 55ms), calc(var(--reveal-i, 0) * 55ms), 0s, 0s !important;
  will-change: opacity, transform;
}

/* 退出：加速离场，比进场快一些，不拖沓 */
html body #app .rv.rv-out, html body .rv.rv-out {
  opacity: 0;
  transition-property: opacity, transform !important;
  transition-duration: 0.34s, 0.42s !important;
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1), cubic-bezier(0.4, 0, 1, 1) !important;
  transition-delay: calc(var(--reveal-i, 0) * 24ms), calc(var(--reveal-i, 0) * 24ms) !important;
}

/* ---------- 位移方向 ---------- */

/* 完整幅度：用于组内卡片 */
html body #app .rv.rv-out[data-reveal-mag='full'], html body .rv.rv-out[data-reveal-mag='full'][data-reveal-dir='left'] {
  transform: translate3d(-56px, 0, 0) scale(0.97);
}
html body #app .rv.rv-out[data-reveal-mag='full'], html body .rv.rv-out[data-reveal-mag='full'][data-reveal-dir='right'] {
  transform: translate3d(56px, 0, 0) scale(0.97);
}

/*
 * 小幅幅度：用于整块 section 和正文段落。
 * 大段文字横向飞太远会晕，这里只做 22px 的轻微侧移 + 上移。
 */
html body #app .rv.rv-out[data-reveal-mag='soft'], html body .rv.rv-out[data-reveal-mag='soft'][data-reveal-dir='left'] {
  transform: translate3d(-22px, 18px, 0);
}
html body #app .rv.rv-out[data-reveal-mag='soft'], html body .rv.rv-out[data-reveal-mag='soft'][data-reveal-dir='right'] {
  transform: translate3d(22px, 18px, 0);
}

/* ---------- 首屏保护 ---------- */

/*
 * Hero 区域自己有一套进场动画，不要再叠一层侧滑，
 * 否则两套动效打架，观感很乱。
 */
.cinema,
.cinema * {
  --reveal-i: 0;
}

/* ---------- 无障碍 ---------- */

@media (prefers-reduced-motion: reduce) {
  .rv,
  .rv.rv-out {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}

.rv-marker {
  display: none;
}
</style>
