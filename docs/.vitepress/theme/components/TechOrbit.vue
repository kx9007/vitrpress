<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { orbitTech } from '../../profile'
import { withBase } from 'vitepress'

/**
 * 技术栈环绕球体
 *
 * 图标均匀分布在球面上，球体绕 Y 轴自转。
 * 转到背面的图标会缩小、变暗、被中心球体遮住，
 * 形成"图标绕着球体飞行"的立体感。
 *
 * ## 为什么用 CSS 3D 而不是 canvas
 *   - 每个图标都是独立 DOM，可以直接挂 hover 提示、可点击
 *   - 文字和矢量图标在任何分辨率下都清晰
 *   - 不需要额外依赖，也不用管 canvas 的 DPR
 *
 * ## 坐标怎么算
 *   用"斐波那契球"布点：把 N 个点均匀铺在球面上，
 *   比按经纬度均分更均匀（两极不会堆积）。
 *
 *   每个点算一次固定的三维坐标 (x, y, z)，之后每帧只做绕 Y 轴旋转：
 *     x' = x·cosθ + z·sinθ
 *     z' = -x·sinθ + z·cosθ
 *   再用 z' 决定缩放和透明度（越远越小越淡）。
 *
 * ## 关键细节
 *   - 用 transform: translate3d 而不是 left/top，避免每帧触发重排
 *   - perspective 放在容器上，子元素才有一致的透视
 *   - 尊重 prefers-reduced-motion：静止显示，不做动画
 */

/**
 * 球面投影半径，单位是容器的百分比。
 * 取 46 表示图标落在 50% ± 46% 的范围内（即 4% ~ 96%）。
 * 图标卡片最大约 54px（46px × 1.18 缩放），容器 420px 时为 6.4%，
 * 所以极端位置会略微探出容器——父级没有 overflow:hidden，不会被裁。
 *
 * 注意：这里必须是百分比而不是 px——
 * 下面 left/top 都用 `%` 输出，若混入像素值会算到 116% 直接飞出容器。
 */
const RADIUS_PCT = 48
const FPS_MS = 16 // 约 60fps

/**
 * 每个图标的三维原始坐标（球面均匀分布）
 *
 * 用斐波那契球布点，但**避开两极**：
 *   y 直接用 i/(n-1) 从 1 到 -1 时，首尾两个点的 y = ±1，
 *   此时水平半径 r = 0，x 和 z 都是 0——这两个图标会永久钉在圆心，
 *   绕 Y 轴旋转时完全不动，而且正好挡在球体中间。
 *
 *   所以把 y 的取值范围收窄到 ±0.86，两端各留一点余量，
 *   让所有点都落在真正的球面上，旋转时不会有人停在圆心。
 */
const points = computed(() => {
  const n = orbitTech.length
  const golden = Math.PI * (3 - Math.sqrt(5)) // 黄金角
  const Y_SPAN = 0.88 // 纵向只取 ±0.88，避开两极

  /*
   * 斐波那契球布点。
   *
   * 注意：34 个点在球面上，投影到二维后**前面和后面的点必然重合**——
   * 这是 3D 投影的固有属性，改布点算法解决不了。
   * 真正的解法是让背面的图标淡到接近看不见（见下面的 opacity 计算），
   * 视觉上同一时刻只有正面那 15~17 个是清晰可见的。
   */
  return orbitTech.map((tech, i) => {
    const y = Y_SPAN - (i / Math.max(1, n - 1)) * Y_SPAN * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    return {
      ...tech,
      base: { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r },
    }
  })
})

/** 旋转角度（弧度），每帧递增 */
const angle = ref(0)
/** 鼠标是否悬停（悬停时减速，方便看清） */
const slowed = ref(false)

let raf = 0
let last = 0
let reduced = false

function tick(now: number) {
  raf = requestAnimationFrame(tick)
  if (!last) last = now
  const dt = now - last
  if (dt < FPS_MS) return
  last = now
  // 正常 0.16 rad/s；悬停时降到 0.045，便于查看
  const speed = slowed.value ? 0.00075 : 0.0027
  angle.value = (angle.value + speed * dt) % (Math.PI * 2)
}

/** 每个图标的当前投影：位置、缩放、透明度、层级 */
const projected = computed(() => {
  const cos = Math.cos(angle.value)
  const sin = Math.sin(angle.value)
  return points.value.map((p) => {
    const { x, y, z } = p.base
    const rx = x * cos + z * sin
    const rz = -x * sin + z * cos
    // 把 z ∈ [-1, 1] 映射到缩放 0.62 ~ 1.18
    const depth = (rz + 1) / 2
    // 缩放收窄到 0.80 ~ 1.14，保证转到最远时图标仍有 37px，不至于看不清
    const scale = 0.80 + depth * 0.34
    /*
     * 背面大幅压暗。
     *
     * 34 个点投影后，前面和背面的图标会叠在同一个位置。
     * 只要把背面那批压到几乎看不见（0.06~0.3），
     * 视觉上就只剩正面的一半清晰可辨，重叠立刻不成问题。
     */
    const opacity = rz < 0
      ? 0.06 + (rz + 1) * 0.24   // -1 → 0.06, 0 → 0.30
      : 0.55 + rz * 0.45         //  0 → 0.55, 1 → 1.00
    /*
     * 层级分两段，以球体（z-index: 50）为界：
     *   背面 rz < 0  → 0~40，被球体挡住，符合"转到球后面"的直觉
     *   正面 rz >= 0 → 60~140，压在球体上方
     * 这样图标绕到前后时会有真实的穿插感，而不是全部浮在球体上。
     */
    const zIndex = rz < 0
      ? Math.round(40 + rz * 40)   // -1 → 0,  0 → 40
      : Math.round(60 + rz * 80)   // 0 → 60,  1 → 140
    return {
      ...p,
      /*
       * 真实的球面投影：rx 是水平分量、y 是垂直分量，都在 [-1, 1]。
       * 不要为了"避开球体"去压缩半径——那会把图标全挤到外圈、
       * 失去轨道感。靠 z-index 让球体盖住转到前面的图标即可，
       * 这也是真实 3D 该有的遮挡关系。
       */
      left: 50 + rx * RADIUS_PCT,
      top: 50 + y * RADIUS_PCT,
      scale,
      opacity,
      zIndex,
      // 背面不加阴影，避免"透过"球体
      behind: rz < 0,
    }
  })
})

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    // 静止时给一个好看的初始角度
    angle.value = 0.6
    return
  }
  raf = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div
    class="orbit"
    :class="{ 'is-slowed': slowed }"
    @pointerenter="slowed = true"
    @pointerleave="slowed = false"
  >
    <!--
      中心光核：不再是实心黑球，改成一层很淡的渐变光晕。
      它的作用是给环绕的图标一个视觉锚点，本身不抢戏。
    -->
    <div class="orbit__core" aria-hidden="true" />

    <!-- 轨道环，纯装饰，用细线暗示球面 -->
    <div class="orbit__ring orbit__ring--a" aria-hidden="true" />
    <div class="orbit__ring orbit__ring--b" aria-hidden="true" />
    <div class="orbit__ring orbit__ring--c" aria-hidden="true" />

    <!-- 环绕的图标 -->
    <ul class="orbit__items">
      <li
        v-for="p in projected"
        :key="p.slug"
        class="orbit__item"
        :class="{ 'is-behind': p.behind }"
        :style="{
          left: `${p.left}%`,
          top: `${p.top}%`,
          opacity: p.opacity,
          zIndex: p.zIndex,
          '--s': p.scale,
          '--c': p.color,
        }"
      >
        <span class="orbit__chip">
          <img
            class="orbit__icon"
            :src="withBase(`/img/tech/${p.slug}.svg`)"
            :alt="p.name"
            loading="lazy"
            draggable="false"
          />
        </span>
        <span class="orbit__label">{{ p.name }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.orbit {
  position: relative;
  width: 100%;
  max-width: 460px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  /* 所有子元素的 3D 变换共用同一透视点 */
  perspective: 900px;
  perspective-origin: 50% 50%;
}

/* ---------- 中心光核 ---------- */

.orbit__core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30%;
  height: 30%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  z-index: 50;
  /*
   * 用主题色叠几层柔光，中心亮、边缘化开，
   * 不做实心填充——实心黑球会显得很沉，和浅色页面冲突。
   */
  background:
    radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--vp-c-bg) 72%, transparent),
      transparent 72%
    ),
    radial-gradient(
      circle at 38% 34%,
      color-mix(in srgb, var(--rb-4) 30%, transparent),
      transparent 62%
    ),
    radial-gradient(
      circle at 66% 68%,
      color-mix(in srgb, var(--rb-6) 26%, transparent),
      transparent 60%
    );
  filter: blur(0.2px);
  box-shadow:
    0 0 60px color-mix(in srgb, var(--rb-5) 20%, transparent),
    inset 0 0 30px color-mix(in srgb, var(--rb-3) 12%, transparent);
  animation: core-breathe 6s ease-in-out infinite;
}

@keyframes core-breathe {
  0%,
  100% {
    opacity: 0.85;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }
}

/* ---------- 轨道环 ---------- */

.orbit__ring {
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 80%, transparent);
  pointer-events: none;
  z-index: 1;
}

/*
 * 三条不同倾角的细环，用来暗示球面。
 * 不再有实心球之后，这几条线就是"球"的唯一线索，
 * 所以要保持很淡，只做氛围，不抢图标的戏。
 */
.orbit__ring--a {
  width: 84%;
  height: 84%;
  transform: translate(-50%, -50%) rotateX(74deg);
  opacity: 0.55;
}

.orbit__ring--b {
  width: 84%;
  height: 84%;
  transform: translate(-50%, -50%) rotateX(74deg) rotateY(48deg);
  opacity: 0.4;
}

/* 一条接近水平的环，补足赤道方向的轨迹感 */
.orbit__ring--c {
  width: 76%;
  height: 76%;
  transform: translate(-50%, -50%) rotateX(88deg) rotateY(-24deg);
  opacity: 0.3;
}

/* ---------- 图标 ---------- */

.orbit__items {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  transform-style: preserve-3d;
}

.orbit__item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  /* 用 CSS 变量控制缩放，避免每帧写 transform 字符串 */
  transform: translate(-50%, -50%) scale(var(--s));
  transition: opacity 0.16s linear;
  will-change: left, top, opacity;
}

.orbit__chip {
  display: grid;
  place-items: center;
  /* 34 个点：46px 会挤在一起，收到 38px 才能在球面上排开 */
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--vp-c-bg-elv, #fff);
  /*
   * 浅色背景下白卡片容易糊进背景，所以这里用比 --vp-c-divider 稍重的线，
   * 再叠一层柔和投影拉开层次。
   */
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 60%, var(--vp-c-text-3) 40%);
  box-shadow:
    0 6px 16px -6px rgba(16, 24, 40, 0.34),
    0 1px 2px rgba(16, 24, 40, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

/* 图标本体 */
.orbit__icon {
  width: 21px;
  height: 21px;
  object-fit: contain;
  pointer-events: none;
}

/* 名称：平时隐藏，悬停单块才显示，避免球面太吵 */
.orbit__label {
  padding: 1px 7px;
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv, #fff);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  opacity: 0;
  transform: translateY(-2px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  pointer-events: none;
}

.orbit__item:hover .orbit__label {
  opacity: 1;
  transform: translateY(0);
}

.orbit__item:hover .orbit__chip {
  border-color: var(--c);
  box-shadow:
    0 0 0 1px var(--c),
    0 8px 22px -8px var(--c);
}

/* 背面：柔化，避免和球体边缘糊在一起 */
.orbit__item.is-behind .orbit__chip {
  filter: blur(0.4px) saturate(0.8);
}

/* 深色模式：卡片底换成深色 */
html.dark .orbit__chip,
html.dark .orbit__label {
  background: #1a1f2e;
}

/* 深色模式里光核要更亮一点，否则会消失在背景里 */
html.dark .orbit__core {
  background:
    radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--rb-6) 22%, transparent),
      transparent 72%
    ),
    radial-gradient(
      circle at 38% 34%,
      color-mix(in srgb, var(--rb-4) 36%, transparent),
      transparent 62%
    ),
    radial-gradient(
      circle at 66% 68%,
      color-mix(in srgb, var(--rb-2) 30%, transparent),
      transparent 60%
    );
}

/* ---------- 响应式 ---------- */

@media (max-width: 640px) {
  .orbit {
    max-width: 330px;
  }
  .orbit__chip {
    width: 30px;
    height: 30px;
    border-radius: 9px;
  }
  .orbit__icon {
    width: 17px;
    height: 17px;
  }
}

/* 尊重动效偏好：不做旋转，只静态铺开 */
@media (prefers-reduced-motion: reduce) {
  .orbit__item {
    transition: none;
  }
}
</style>
