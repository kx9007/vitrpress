<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { withBase } from 'vitepress'
import { profile } from '../../profile'
import RainbowFan from './RainbowFan.vue'

/**
 * 全屏电影感首屏
 *
 * 背景优先级：
 *   1. 如果 docs/public/hero-bg.mp4 存在 → 用真实视频（静音循环播放）
 *   2. 否则 → Canvas 动态光影（流体光晕 + 星尘），效果接近视频但零资源
 *
 * 两者都裁到 100vh，营造大全屏的视觉体量。
 */

const root = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const videoReady = ref(false)
const videoFailed = ref(false)
const mouse = ref({ x: 0.5, y: 0.5 })
const scrolled = ref(false)

let raf = 0
let ctx: CanvasRenderingContext2D | null = null
let w = 0
let h = 0
let dpr = 1

/* ---------- 光斑与星尘 ---------- */
type Blob = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hue: number
  a: number
}
type Dust = { x: number; y: number; s: number; vx: number; vy: number; a: number }

let blobs: Blob[] = []
let dust: Dust[] = []

const HUES = [210, 265, 300, 190, 160]

function initBlobs() {
  blobs = HUES.map((hue, i) => ({
    x: (i + 0.5) / HUES.length,
    y: 0.35 + Math.sin(i * 1.7) * 0.22,
    vx: (Math.random() - 0.5) * 0.00016,
    vy: (Math.random() - 0.5) * 0.00012,
    r: 0.4 + Math.random() * 0.26,
    hue,
    a: 0.5 + Math.random() * 0.22,
  }))
}

function initDust(count: number) {
  dust = Array.from({ length: count }, (_, i) => {
    // 三层景深：近景少而大、中景中等、远景多而细
    const tier = i < count * 0.12 ? 0 : i < count * 0.4 ? 1 : 2
    const spec = [
      { s: [1.6, 2.6], v: 0.0005, a: [0.55, 0.95] }, // 近
      { s: [0.9, 1.6], v: 0.00026, a: [0.3, 0.6] }, // 中
      { s: [0.25, 0.8], v: 0.00012, a: [0.12, 0.34] }, // 远
    ][tier]
    return {
      x: Math.random(),
      y: Math.random(),
      s: spec.s[0] + Math.random() * (spec.s[1] - spec.s[0]),
      vx: (Math.random() - 0.5) * spec.v,
      vy: -spec.v * 0.35 - Math.random() * 0.00008,
      a: spec.a[0] + Math.random() * (spec.a[1] - spec.a[0]),
    }
  })
}

function resize() {
  const c = canvasRef.value
  if (!c) return
  const cw = c.clientWidth
  const ch = c.clientHeight
  // 布局未完成时拿到 0，直接跳过，等下一次调用
  if (!cw || !ch) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = cw
  h = ch
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  ctx = c.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  initDust(w < 640 ? 34 : 90)
}

function draw(t: number) {
  if (!ctx || w === 0 || h === 0) {
    resize()
    raf = requestAnimationFrame(draw)
    return
  }
  ctx.clearRect(0, 0, w, h)

  // 底色
  const g0 = ctx.createLinearGradient(0, 0, w * 0.4, h)
  g0.addColorStop(0, 'rgba(8,10,20,1)')
  g0.addColorStop(0.55, 'rgba(12,14,28,1)')
  g0.addColorStop(1, 'rgba(6,8,18,1)')
  ctx.fillStyle = g0
  ctx.fillRect(0, 0, w, h)

  // 光斑：叠加混合形成流体感
  ctx.globalCompositeOperation = 'lighter'
  const px = (mouse.value.x - 0.5) * 0.06
  const py = (mouse.value.y - 0.5) * 0.05

  for (const b of blobs) {
    b.x += b.vx
    b.y += b.vy
    if (b.x < -0.15) b.x = 1.15
    if (b.x > 1.15) b.x = -0.15
    if (b.y < -0.15) b.y = 1.15
    if (b.y > 1.15) b.y = -0.15

    const cx = (b.x + px) * w
    const cy = (b.y + py) * h
    const rr = b.r * Math.max(w, h)

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr)
    g.addColorStop(0, `hsla(${b.hue}, 92%, 62%, ${b.a})`)
    g.addColorStop(0.45, `hsla(${b.hue}, 92%, 55%, ${b.a * 0.35})`)
    g.addColorStop(1, `hsla(${b.hue}, 92%, 50%, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, rr, 0, Math.PI * 2)
    ctx.fill()
  }

  // 缓慢漂移的光带：让背景有明确的"流动"方向感
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 3; i++) {
    const shift = Math.sin(t * 0.00018 + i * 2.1) * 0.28
    const lg = ctx.createLinearGradient(
      (0.1 + shift) * w, 0,
      (0.9 + shift) * w, h
    )
    const hue = [196, 268, 320][i]
    lg.addColorStop(0, 'rgba(0,0,0,0)')
    lg.addColorStop(0.42, `hsla(${hue}, 90%, 60%, 0.16)`)
    lg.addColorStop(0.58, `hsla(${hue}, 90%, 62%, 0.1)`)
    lg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = lg
    ctx.fillRect(0, 0, w, h)
  }

  // 星尘
  ctx.globalCompositeOperation = 'lighter'
  for (const d of dust) {
    d.x += d.vx
    d.y += d.vy
    if (d.y < -0.02) {
      d.y = 1.02
      d.x = Math.random()
    }
    if (d.x < -0.02) d.x = 1.02
    if (d.x > 1.02) d.x = -0.02
    const tw = 0.55 + Math.sin(t * 0.0011 + d.x * 12) * 0.45
    // 越小越虚，模拟远景失焦
    if (d.s < 0.9) {
      ctx.shadowBlur = 2.5
      ctx.shadowColor = 'rgba(200, 225, 255, 0.5)'
    } else {
      ctx.shadowBlur = 0
    }
    ctx.fillStyle = `rgba(220, 235, 255, ${d.a * tw})`
    ctx.beginPath()
    ctx.arc(d.x * w, d.y * h, d.s, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.shadowBlur = 0

  // 顶部/底部压暗，保证文字可读
  ctx.globalCompositeOperation = 'source-over'
  const vg = ctx.createLinearGradient(0, 0, 0, h)
  vg.addColorStop(0, 'rgba(4,6,14,0.62)')
  vg.addColorStop(0.45, 'rgba(4,6,14,0.12)')
  vg.addColorStop(1, 'rgba(4,6,14,0.78)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)

  raf = requestAnimationFrame(draw)
}

/* ---------- 交互 ---------- */
function onPointerMove(e: PointerEvent) {
  const el = root.value
  if (!el) return
  const r = el.getBoundingClientRect()
  mouse.value = {
    x: (e.clientX - r.left) / r.width,
    y: (e.clientY - r.top) / r.height,
  }
  el.style.setProperty('--mx', `${mouse.value.x * 100}%`)
  el.style.setProperty('--my', `${mouse.value.y * 100}%`)
}

function onScroll() {
  const past = window.scrollY > 40
  scrolled.value = past
  // 同步到根元素，供全局样式切换导航栏形态
  document.documentElement.classList.toggle('cinema-scrolled', past)
}

/* ---------- 视频探测 ----------
   构建期不能出现 /hero-bg.mp4 字面量（Rollup 会当模块解析并报错），
   所以拼成变量，再用 fetch HEAD 探测文件是否存在。 */
/**
 * 视频是否可用由 profile.ts 的 heroVideo 字段控制：
 * 你放了文件后把那里改成 '/hero-bg.mp4' 即可启用，
 * 这样没视频时不会产生任何 404 请求或控制台报错。
 */
const VIDEO_PATH = profile.heroVideo || ''

function tryVideo() {
  const v = videoRef.value
  if (!v || !VIDEO_PATH) {
    videoFailed.value = true
    return
  }

  v.addEventListener(
    'loadeddata',
    () => {
      videoReady.value = true
    },
    { once: true }
  )
  v.addEventListener(
    'error',
    () => {
      videoFailed.value = true
    },
    { once: true }
  )

  v.src = VIDEO_PATH
  v.load()
}

/* ---------- 生命周期 ---------- */
onMounted(() => {
  // 标记当前是沉浸式首屏，供全局样式把导航栏变透明
  document.documentElement.classList.add('has-cinema-hero')
  initBlobs()
  // 等一帧让布局稳定，否则 clientWidth 可能是 0
  requestAnimationFrame(() => {
    resize()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      draw(0)
      cancelAnimationFrame(raf)
    } else {
      raf = requestAnimationFrame(draw)
    }
  })
  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })

  tryVideo()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('has-cinema-hero', 'cinema-scrolled')
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('pointermove', onPointerMove)
})

const showCanvas = computed(() => videoFailed.value || !videoReady.value)
</script>

<template>
  <section ref="root" class="cinema" :class="{ 'is-scrolled': scrolled }">
    <!-- ① 真实视频（存在 public/hero-bg.mp4 时自动启用） -->
    <video
      v-show="videoReady"
      ref="videoRef"
      class="cinema__media"
      autoplay
      muted
      loop
      playsinline
      preload="none"
      aria-hidden="true"
    />

    <!-- ② Canvas 动态光影（视频缺失时的兜底，也是默认效果） -->
    <canvas v-show="showCanvas" ref="canvasRef" class="cinema__media" aria-hidden="true" />

    <!-- 颗粒噪点，压掉数字感的锐利 -->
    <div class="cinema__grain" aria-hidden="true" />

    <!-- 文字区局部暗蒙层：背景光晕再亮也不影响正文可读 -->
    <div class="cinema__scrim" aria-hidden="true" />

    <!-- 内容 -->
    <div class="cinema__inner">
      <div class="cinema__intro">
        <span class="cinema__avatar">
          <img
            v-if="profile.avatar"
            :src="profile.avatar"
            :alt="`${profile.name} 的头像`"
            width="76"
            height="76"
            loading="eager"
            decoding="async"
          />
          <span v-else class="cinema__avatar-fallback">{{ profile.initials }}</span>
        </span>
        <p class="cinema__eyebrow">
          <span class="cinema__dot" />
          你好，我是
        </p>
      </div>

      <h1 class="cinema__name">
        <span class="cinema__name-text">{{ profile.name }}</span>
      </h1>

      <p class="cinema__role">{{ profile.title }}</p>

      <p class="cinema__desc">
        专注于 Web 前端工程化与交互体验设计，喜欢把复杂的问题拆成简单的模块。这里记录做过的项目、写下的思考，以及正在学习的东西。
      </p>

      <div class="cinema__actions">
        <a class="cbtn cbtn--solid" :href="withBase('/projects')">
          看看我的项目
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              d="M5 12h13M13 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </a>
        <a class="cbtn cbtn--ghost" :href="withBase('/blog/')">读读博客</a>
      </div>

      <div class="cinema__meta">
        <span>{{ profile.location }}</span>
        <span class="cinema__sep" />
        <span>{{ profile.status }}</span>
      </div>
    </div>

    <!-- 右侧彩虹扇环：加载聚拢 → 自转 → 悬停加速 -->
    <div class="cinema__fan">
      <RainbowFan />
    </div>

    <!-- 滚动提示 -->
    <div class="cinema__hint" aria-hidden="true">
      <span class="cinema__hint-line" />
      <span class="cinema__hint-text">向下滚动</span>
    </div>
  </section>
</template>

<style scoped>
.cinema {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 100vh;
  min-height: 100svh;
  padding: 96px 24px 88px;
  overflow: hidden;
  isolation: isolate;
  background: #06080f;
}

/* ---------- 背景层 ---------- */
.cinema__media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
  /* 轻微放大，配合滚动做视差 */
  transform: scale(1.06);
  transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.is-scrolled .cinema__media {
  transform: scale(1.12);
}

.cinema__scrim {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  /* 左侧到中部渐暗，正文压在这块上 */
  background:
    radial-gradient(72% 62% at 26% 52%, rgba(3, 5, 12, 0.62), transparent 72%),
    linear-gradient(96deg, rgba(3, 5, 12, 0.55) 0%, rgba(3, 5, 12, 0.18) 46%, transparent 68%);
}

.cinema__grain {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.16;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
}

/* ---------- 内容 ---------- */
.cinema__inner {
  position: relative;
  width: 100%;
  max-width: 1152px;
  margin: 0 auto;
  /* 跟随指针的极轻微位移，制造纵深 */
  transform: translate3d(
    calc((var(--mx, 50%) - 50%) * 0.02),
    calc((var(--my, 50%) - 50%) * 0.02),
    0
  );
  transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

.cinema__intro {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
}

/* 头像：圆形 + 彩虹细环 + 轻微悬浮 */
.cinema__avatar {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  padding: 2px;
  background: conic-gradient(
    from 140deg,
    var(--rb-1),
    var(--rb-3),
    var(--rb-5),
    var(--rb-7),
    var(--rb-1)
  );
  box-shadow:
    0 10px 28px -12px rgba(10, 16, 40, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.16);
  animation: avatar-float 7s ease-in-out infinite;
}

.cinema__avatar img,
.cinema__avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  background: rgba(10, 14, 28, 0.6);
}

.cinema__avatar-fallback {
  display: grid;
  place-items: center;
  font-size: 26px;
  font-weight: 720;
  letter-spacing: 0.02em;
  color: #fff;
}

@keyframes avatar-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.cinema__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 12.5px;
  font-weight: 560;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(235, 240, 255, 0.82);
}

.cinema__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5eead4;
  box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.16);
  animation: breathe 2.8s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    opacity: 0.55;
    box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.12);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 0 7px rgba(94, 234, 212, 0.04);
  }
}

/* 超大字标题：这是「大气」的核心 */
.cinema__name {
  margin: 0;
  font-size: clamp(52px, 9.2vw, 132px);
  line-height: 1.0;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.cinema__name-text {
  display: inline-block;
  /* 白→淡彩渐变，配深色动态背景 */
  background: linear-gradient(
    96deg,
    #ffffff 0%,
    #dbeafe 26%,
    #c7d2fe 48%,
    #a5b4fc 66%,
    #ffffff 100%
  );
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: sheen 12s ease-in-out infinite;
  filter: drop-shadow(0 8px 40px rgba(120, 160, 255, 0.28));
}

@keyframes sheen {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.cinema__role {
  margin: 28px 0 0;
  font-size: clamp(16px, 1.7vw, 21px);
  font-weight: 560;
  letter-spacing: 0.01em;
  color: rgba(226, 235, 255, 0.9);
}

.cinema__desc {
  max-width: 540px;
  margin: 20px 0 0;
  font-size: 15px;
  line-height: 1.86;
  color: rgba(232, 239, 253, 0.96);
  text-shadow: 0 1px 14px rgba(4, 8, 18, 0.62);
}

/* ---------- 按钮 ---------- */
.cinema__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

/* ---------- 按钮：液态玻璃胶囊 ---------- */
.cbtn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  padding: 0 28px;
  font-size: 14.5px;
  font-weight: 580;
  text-decoration: none;
  border-radius: 999px;
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease;
}

/* 顶部玻璃反光带：两个按钮共用 */
.cbtn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: -1;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.42) 0%,
      rgba(255, 255, 255, 0.1) 38%,
      rgba(255, 255, 255, 0) 58%
    ),
    /* 左下角对角反光，模拟玻璃棱边的镜面 */
    linear-gradient(
      115deg,
      rgba(255, 255, 255, 0.22) 0%,
      rgba(255, 255, 255, 0) 30%
    );
  opacity: 0.95;
  transition: opacity 0.35s ease;
}

/* 主按钮：VitePress 原生 brand 实心按钮 */
.cbtn--solid {
  color: #fff;
  background: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-brand-1);
}

.cbtn--solid:hover {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

/*
 * 次按钮
 * 首屏是深色背景，不能直接用浅色主题的 --vp-c-bg-soft（会变成一块白底）。
 * 这里固定用半透明白描边，和深色背景匹配。
 */
.cbtn--ghost {
  color: rgba(240, 245, 255, 0.95);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.32);
}

.cbtn--ghost:hover {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

/* 按下：原生按钮不需要形变 */
.cbtn:active {
  opacity: 0.9;
}

/* 移除玻璃反光层 */
.cbtn::before {
  display: none;
}

/* ---------- meta ---------- */
.cinema__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
  font-size: 12.5px;
  color: rgba(214, 224, 245, 0.9);
}

.cinema__sep {
  width: 1px;
  height: 11px;
  background: rgba(255, 255, 255, 0.2);
}

/* ---------- 滚动提示 ---------- */
/* ---------- 右侧彩虹扇环 ---------- */
.cinema__fan {
  position: absolute;
  /* 垂直略偏下，避开顶部导航 */
  /* 中心略上移，与左侧标题形成对角呼应 */
  top: 45%;
  right: clamp(20px, 5vw, 90px);
  width: clamp(320px, 38vw, 620px);
  height: clamp(320px, 38vw, 620px);
  transform: translateY(-50%);
  z-index: 1;
  pointer-events: auto;
}

/* 窄屏不显示装饰装置，避免遮挡正文 */
@media (max-width: 1100px) {
  .cinema__fan {
    display: none;
  }
}

.cinema__hint {
  position: absolute;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.cinema__hint-line {
  width: 1px;
  height: 34px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.6), transparent);
  animation: hint-drop 2.6s ease-in-out infinite;
}

@keyframes hint-drop {
  0%,
  100% {
    opacity: 0.2;
    transform: scaleY(0.5);
    transform-origin: top;
  }
  50% {
    opacity: 1;
    transform: scaleY(1);
    transform-origin: top;
  }
}

.cinema__hint-text {
  font-size: 10.5px;
  letter-spacing: 0.18em;
  color: rgba(228, 237, 252, 0.92);
}

.is-scrolled .cinema__hint {
  opacity: 0;
  transition: opacity 0.4s ease;
}

/* ---------- 进场动画 ---------- */
.cinema__intro,
.cinema__name,
.cinema__role,
.cinema__desc,
.cinema__actions,
.cinema__meta {
  opacity: 0;
  transform: translateY(26px);
  animation: rise 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.cinema__intro {
  animation-delay: 0.05s;
}
.cinema__name {
  animation-delay: 0.16s;
}
.cinema__role {
  animation-delay: 0.3s;
}
.cinema__desc {
  animation-delay: 0.4s;
}
.cinema__actions {
  animation-delay: 0.5s;
}
.cinema__meta {
  animation-delay: 0.6s;
}

@keyframes rise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- 响应式 ---------- */
@media (max-width: 768px) {
  .cinema {
    padding: 84px 20px 72px;
    min-height: 92svh;
  }
  .cinema__desc {
    font-size: 14px;
    line-height: 1.8;
  }
  .cinema__actions {
    gap: 10px;
  }
  .cbtn {
    height: 44px;
    padding: 0 20px;
    font-size: 13.5px;
  }
  .cinema__hint {
    bottom: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cinema__media,
  .cinema__inner,
  .cinema__dot,
  .cinema__name-text,
  .cinema__hint-line {
    animation: none !important;
    transition: none !important;
  }
  .cinema__intro,
  .cinema__name,
  .cinema__role,
  .cinema__desc,
  .cinema__actions,
  .cinema__meta {
    opacity: 1;
    transform: none;
    animation: none;
  }
}
</style>
