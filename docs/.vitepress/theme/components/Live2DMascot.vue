<script setup lang="ts">
import { onMounted } from 'vue'

/**
 * Live2D 看板娘
 *
 * 基于 https://github.com/stevenjoezhang/live2d-widget（GPL-3.0）。
 *
 * ## 为什么不直接用官方的 autoload.js
 *   官方 autoload.js 会在加载完立即 initWidget 并写死一整套配置。
 *   在 VitePress 这种 SPA 里有两个问题：
 *     1. 它有副作用，没法按需传配置（模型、工具按钮、文案都得改源文件）
 *     2. 组件重新挂载时会重复注入脚本和样式
 *   所以这里自己实现加载流程：动态插入 css / js，等 waifu-tips.js
 *   把 initWidget 挂到 window 之后再调用它，并用 window 上的标记位防重复。
 *
 * ## 资源说明
 *   - widget 本体走 jsDelivr CDN（live2d-widgets@1.0.1）
 *   - 模型来自 fghrsh/live2d_api（该仓库自身不含模型）
 *   - Cubism 2 内核随 widget 一起下发；Cubism 5 内核在 Live2D 官方 CDN
 */

const WIDGET_BASE = 'https://fastly.jsdelivr.net/npm/live2d-widgets@1.0.1/dist/'
const MODEL_BASE = 'https://fastly.jsdelivr.net/gh/fghrsh/live2d_api/'

/** 提示文案：替换掉官方那套面向 Hexo 主题的默认文案 */
const TIPS = {
  mouseover: [
    {
      selector: '#waifu-tool-hitokoto',
      text: ['想听点什么呢？', '随便说一句吧～'],
    },
    {
      selector: '#waifu-tool-switch-model',
      text: ['要换一个角色吗？', '看看别的样子～'],
    },
    {
      selector: '#waifu-tool-switch-texture',
      text: ['换身衣服试试？'],
    },
    {
      selector: '#waifu-tool-photo',
      text: ['要拍张照吗？'],
    },
    {
      selector: '#waifu-tool-info',
      text: ['想了解我一下？'],
    },
    {
      selector: '#waifu-tool-quit',
      text: ['要我先休息一会儿吗？'],
    },
  ],
  click: [
    {
      selector: '.cbtn--solid, .cbtn--ghost',
      text: ['要去看看吗？', '点这里就对了～'],
    },
    {
      selector: '.mascot-tip',
      text: ['有事随时叫我～'],
    },
  ],
  seasons: [
    { date: '01/01', text: '<span>元旦</span>了呢，{year} 年也要好好的～' },
    { date: '05/01', text: '<span>劳动节</span>，今天该休息一下了' },
    { date: '10/01', text: '<span>国庆节</span>快乐！' },
  ],
  time: [
    { hour: '6-7', text: '早上好～今天也要元气满满' },
    { hour: '8-11', text: '上午好，别坐太久，起来走走' },
    { hour: '12-13', text: '中午了，该吃饭啦' },
    { hour: '14-17', text: '下午了，来杯咖啡提提神？' },
    { hour: '18-22', text: '晚上好，今天辛苦了' },
    { hour: '23-5', text: '这么晚还没睡？早点休息吧' },
  ],
  message: {
    default: ['随便逛逛吧～', '右上角可以换主题色哦'],
  },
}

/**
 * 把提示文案转成 Blob URL。
 * waifu-tips.js 会 fetch 这个地址，所以不能直接传对象。
 */
function makeTipsUrl(): string {
  const json = JSON.stringify(TIPS)
  return URL.createObjectURL(new Blob([json], { type: 'application/json' }))
}

/** 动态加载 css */
function loadCss(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[data-live2d="${href}"]`)) return resolve()
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.dataset.live2d = href
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`css failed: ${href}`))
    document.head.appendChild(link)
  })
}

/** 动态加载 js（widget 用 type=module） */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-live2d="${src}"]`)) return resolve()
    const el = document.createElement('script')
    el.type = 'module'
    el.src = src
    el.dataset.live2d = src
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`js failed: ${src}`))
    document.head.appendChild(el)
  })
}

/** 轮询等待 initWidget 就绪（module 脚本里是 window.initWidget） */
function waitForInitWidget(timeout = 15000): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      if (typeof (window as any).initWidget === 'function') return resolve(true)
      if (Date.now() - start > timeout) return resolve(false)
      setTimeout(tick, 120)
    }
    tick()
  })
}

async function boot() {
  // 组件可能因路由重建而多次挂载，用全局标记保证只初始化一次
  const flag = '__live2dWidgetBooted__'
  if ((window as any)[flag]) return
  ;(window as any)[flag] = true

  // 移动端不加载：小屏上角色会挡住正文，且吃性能
  if (window.matchMedia('(max-width: 768px)').matches) return

  // 官方为了规避图片跨域问题会全局改写 Image，这里保持一致
  const OriginalImage = window.Image
  ;(window as any).Image = function (...args: any[]) {
    const img = new (OriginalImage as any)(...args)
    img.crossOrigin = 'anonymous'
    return img
  }
  ;(window as any).Image.prototype = OriginalImage.prototype

  try {
    await Promise.all([
      loadCss(`${WIDGET_BASE}waifu.css`),
      loadScript(`${WIDGET_BASE}waifu-tips.js`),
    ])

    const ok = await waitForInitWidget()
    if (!ok) {
      console.warn('[live2d] initWidget 未就绪，看板娘未加载')
      return
    }

    ;(window as any).initWidget({
      waifuPath: makeTipsUrl(),
      cdnPath: MODEL_BASE,
      cubism2Path: `${WIDGET_BASE}live2d.min.js`,
      cubism5Path:
        'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
      // 默认用 Pio，是小巧的经典模型，加载快
      modelId: 0,
      // 只保留常用按钮：一言、换装、换角色、拍照、关于、退出
      tools: [
        'hitokoto',
        'switch-model',
        'switch-texture',
        'photo',
        'info',
        'quit',
      ],
      drag: true,
      showToggleAfterQuit: true,
      logLevel: 'warn',
    })
  } catch (e) {
    // 加载失败不应该影响页面本身，只记录
    console.warn('[live2d] 加载失败：', e)
  }
}

onMounted(() => {
  // 等主线程空闲一点再启动，避免和首屏动画抢资源
  const idle = (window as any).requestIdleCallback
  if (typeof idle === 'function') {
    idle(() => boot(), { timeout: 3000 })
  } else {
    setTimeout(boot, 900)
  }
})
</script>

<template>
  <!--
    Live2D Widget 自己往 body 末尾插入 DOM 并固定定位，
    所以这个组件本身不渲染任何可见元素，只负责触发加载。
  -->
  <div class="live2d-host" aria-hidden="true" />
</template>

<style>
/*
 * Live2D 官方样式的默认位置在左下角，但层级和尺寸需要按本站调一下。
 * 这里用非 scoped 样式，因为 widget 的 DOM 是运行时插入的，
 * 不在当前组件的 scope 内。
 */

/*
 * 位置与尺寸（合并成一条规则，避免同优先级互相覆盖）
 *
 * 位置：官方样式给 #waifu 加了 transform: translateY(25px)，
 * 配合 bottom: 0 会把 300px 的盒子整体下移 25px，导致身体下半截被
 * 视口底边切掉。这里把位移抵消掉，让脚正好落在底边上。
 *
 * 尺寸：首屏内容区 max-width: 1152px 且居中，两侧留白 = (100vw - 1152px)/2。
 * 角色必须待在这段留白里，否则会压住正文和按钮。
 * 但 1401px 这类窗口留白只有 125px，硬塞进去角色就太小，
 * 所以用 scale 把 300px 画布等比缩到留白宽度——transform 不影响布局盒，
 * 视觉上变小，布局上仍是贴在左下角。
 */
html body #waifu {
  /*
   * 缩放比：留白 - 左边距 12px，再除以画布 300px。
   * 用 @media 分段给固定值，不用 clamp(calc(vw)) ——
   * scale() 里带 vw 的 calc 在部分浏览器里会被整个丢掉，
   * 表现为 transform 静默失效、角色按 300px 原尺寸溢出。
   */
  --l2d-scale: 0.36;

  /* 低于 VitePress 导航栏，避免遮挡下拉菜单 */
  z-index: 20 !important;
  left: 12px !important;
  bottom: 0 !important;
  transform: translateY(0) scale(var(--l2d-scale)) !important;
  transform-origin: left bottom !important;
  transition: opacity 0.3s ease;
}

html body #waifu #live2d,
html body #waifu #live2d canvas {
  width: 300px !important;
  height: 300px !important;
}

/*
 * 用断点覆盖缩放比，保证每个宽度档角色都塞得进左侧留白。
 * 留白 = (100vw - 1152px)/2，减去 12px 左边距后再除以 300。
 */
@media (min-width: 1550px) { html body #waifu { --l2d-scale: 0.58; } }
@media (min-width: 1650px) { html body #waifu { --l2d-scale: 0.76; } }

/* 超宽屏：画布直接放大，不用 scale */
@media (min-width: 1720px) {
  html body #waifu {
    --l2d-scale: 1;
    transform: translateY(0) !important;
  }
  html body #waifu #live2d,
  html body #waifu #live2d canvas {
    width: 340px !important;
    height: 340px !important;
  }
}

/* 悬停时轻微上浮；注意要带上 scale，否则缩放会被覆盖掉 */
html body #waifu:hover {
  transform: translateY(-6px) scale(var(--l2d-scale)) !important;
}

@media (min-width: 1720px) {
  html body #waifu:hover {
    transform: translateY(-6px) !important;
  }
}

/* 小屏隐藏 */
@media (max-width: 768px) {
  #waifu,
  #waifu-toggle {
    display: none !important;
  }
}

/*
 * 宽版页面（API 站点页）：
 * 这些页面容器上限 1720px，1280~1720 之间左侧留白只剩几十像素，
 * 原来的缩放比是按 1152px 内容区算的，角色会压住左侧卡片。
 * 这里把角色缩到 0.30 并贴边，保证不侵入卡片区。
 */
@media (min-width: 769px) and (max-width: 1720px) {
  .page-wide ~ #waifu,
  html body:has(.page-wide) #waifu {
    --l2d-scale: 0.19;
    left: 0 !important;
  }
}

/* 深色模式下给角色一点点辉光，避免边缘发灰 */
html.dark #waifu canvas {
  filter: drop-shadow(0 0 12px rgba(120, 130, 255, 0.16));
}

/* 尊重动效偏好 */
@media (prefers-reduced-motion: reduce) {
  #waifu,
  #waifu:hover {
    transition: none !important;
    transform: translateY(0) !important;
  }
}
</style>
