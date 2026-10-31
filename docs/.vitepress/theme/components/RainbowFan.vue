<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

/**
 * 彩虹花冠
 *
 * 七片花瓣=七段半圆弧，只画外圈弧线，不闭合、不带弦。
 *
 *   M 左端 → A R R 0 0 1 右端
 *
 * 没有 Z：加 Z 会沿两端连线补出直线弦，就不是纯弧线了。
 * 两个半径都写 R（相等）才是正圆弧。
 */

const hovering = ref(false)
const assembled = ref(false)
const ready = ref(false)

let timer: ReturnType<typeof setTimeout> | null = null

/**
 * 12 色环形色谱（等距 30°）。
 *
 * 从 7 条加到 12 条：7 条在视觉上偏稀疏、撑不满一圈，
 * 12 条正好填满且相邻色相过渡自然（每格约 30° 色相）。
 */
const COLORS = [
  '#ff4d6d', // 红
  '#ff7a45', // 橙红
  '#ff9645', // 橙
  '#ffc23d', // 琥珀
  '#ffd93d', // 黄
  '#9ee34a', // 黄绿
  '#6ee77a', // 绿
  '#3ddba8', // 青绿
  '#4dd6e8', // 青
  '#4da8ff', // 天蓝
  '#5b8cff', // 蓝
  '#b06bff', // 紫
]

const PETAL_COUNT = COLORS.length
const STEP = 360 / PETAL_COUNT

/** 圆心与几何参数（viewBox 400×400） */
const CX = 200
const CY = 200

/**
 * 圆弧花瓣（绕中心圆环排布）
 *
 * 七片花瓣都是正圆弧，但**不再挤在同一个点上**——
 * 每片的起点落在中心圆环的边缘，向外弧出去。
 *
 *   M 圆环上一点 → A R R 0 0 1 尖端
 *
 * ## 为什么要留中心圆
 *   七条弧如果都精确共点，中心附近会糊成一团毛刺：
 *   看不清起点，整朵花也没有视觉重心。
 *   在中间放一个实心圆当"轴"，弧从环边出发，
 *   结构立刻清楚，看起来才协调。
 *
 * ## 参数
 *   HUB_R  = 32   中心圆半径（同时是每片弧的起点半径）
 *   LENGTH = 150  弧的弦长（起点 → 尖端）
 *   BOW    = 52   弧向一侧鼓出的高度
 *
 *   R = (LENGTH²/4 + BOW²) / (2·BOW) ≈ 80.19
 *
 * 尺寸受画布限制：viewBox 是 400×400，圆心到边界只有 200。
 * 花瓣尖端半径 = HUB_R + LENGTH，必须小于 200，否则会被裁掉。
 * 当前 32 + 150 = 182，实测弧上最远点 182，留了 18 的余量。
 *
 * 两个半径都写 R（相等），所以是正圆弧，不是椭圆弧。
 */
const HUB_R = 32

/** 弧的弦长：起点到尖端 */
const LENGTH = 150

/** 弧向一侧鼓出的高度，越大叶片越弯 */
const BOW = 30.5

/** 由弦长与鼓高反解出的圆弧半径 */
const R = (Math.pow(LENGTH / 2, 2) + Math.pow(BOW, 2)) / (2 * BOW)

/** 尖端相对正上方偏的角度，让弧斜着甩出去、形成统一旋向 */
const SKEW = 8

/** 尖端到圆心的距离 */
const TIP_R = HUB_R + LENGTH

/** 单片花瓣：从圆环边缘出发、向一侧鼓出的圆弧 */
const PETAL_PATH = (() => {
  const a = ((-90 + SKEW) * Math.PI) / 180
  const ex = CX + TIP_R * Math.cos(a)
  const ey = CY + TIP_R * Math.sin(a)
  return `M ${CX} ${CY - HUB_R} A ${R} ${R} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`
})()


/**
 * 花瓣围绕圆心的旋转角，均匀分布。
 * startX/startY 与 tipX/tipY 分别是该片两端在世界坐标里的位置，供渐变用。
 */
/**
 * 飞入起点：每片花瓣从「自己方位」的外侧远处飞来。
 *
 * 关键点：
 *   - 方向用 i×30° 的方位角，所以 12 片是从 12 个不同方向进来的，
 *     视觉上就是"从四面八方聚拢"。
 *   - 位移加在自己的 <g> 上、且在 rotate 之前作用，
 *     所以不会跟着方位旋转一起转。
 *   - 距离取 300px，大于画布半径 200，保证起始点在可视区外，
 *     真正是"从画面外飞进来"，而不是在画面里滑一下。
 *   - 顺带加一点自身旋转（flyRot），飞行轨迹更生动。
 */
const FLY_DIST = 300

const PETALS = COLORS.map((color, i) => {
  const rad = ((i * STEP - 90) * Math.PI) / 180
  const tipRad = ((i * STEP - 90 + SKEW) * Math.PI) / 180
  return {
    color,
    angle: i * STEP,
    // 依次入场，形成一圈扫过的节奏
    delay: i * 55,
    startX: CX + HUB_R * Math.cos(rad),
    startY: CY + HUB_R * Math.sin(rad),
    tipX: CX + TIP_R * Math.cos(tipRad),
    tipY: CY + TIP_R * Math.sin(tipRad),
    // 从方位角方向的外侧飞入
    flyX: +(Math.cos(rad) * FLY_DIST).toFixed(1),
    flyY: +(Math.sin(rad) * FLY_DIST).toFixed(1),
    // 飞行时自带一点旋转，避免直线平移显得机械
    flyRot: i % 2 === 0 ? -18 : 18,
  }
})

/**
 * 中心盘的"棒棒糖"条纹。
 *
 * 做法：把圆盘切成偶数个扇形，相邻扇形填不同颜色，
 * 绕一圈形成 12 色相间的糖面效果——和棒棒糖的螺旋条纹同理。
 *
 * 为什么用扇形而不是 conic-gradient：
 *   SVG 没有原生 conic 渐变，只能自绘扇形。
 *   好处是每个扇形是独立 <path>，可以单独控制透明度做高光。
 */
const HUB_WEDGES = (() => {
  const COUNT = 36 // 36 条色带：更细的条纹能弱化边缘锯齿
  const seg = 360 / COUNT
  /*
   * SWIRL 是螺旋的扭转量。
   *
   * 每条色带的两侧不是笔直的半径，而是从圆心到圆周逐渐"拧"过去：
   * 半径越大，角度偏移越多。取 42° 时，外缘相对内缘转了 42°，
   * 视觉上就是棒棒糖那种向内卷的螺纹。
   * 取 0 就是普通放射扇形，取太大（>90°）会卷成一团。
   */
  const SWIRL = 42
  const STEPS = 20 // 每条侧边用 20 段折线逼近螺线，段数越多越平滑

  /** 生成一条从圆心螺旋到圆周的曲线点集 */
  const spiral = (baseDeg: number) => {
    const pts: Array<[number, number]> = []
    for (let k = 0; k <= STEPS; k++) {
      const t = k / STEPS // 0 = 圆心, 1 = 边缘
      const r = HUB_R * t
      // 角度随半径逐渐偏移，形成扭转
      const deg = baseDeg + SWIRL * t
      const rad = (deg - 90) * (Math.PI / 180)
      pts.push([CX + r * Math.cos(rad), CY + r * Math.sin(rad)])
    }
    return pts
  }

  return Array.from({ length: COUNT }, (_, i) => {
    const a = i * seg
    const b = (i + 1) * seg
    const sideA = spiral(a)
    const sideB = spiral(b)

    // 外缘那一小段圆弧：从 A 侧末端到 B 侧末端
    const [ax, ay] = sideA[sideA.length - 1]
    const [bx, by] = sideB[sideB.length - 1]
    const outerArc = `A ${HUB_R} ${HUB_R} 0 0 1 ${bx.toFixed(2)} ${by.toFixed(2)}`

    const d =
      `M ${CX} ${CY} ` +
      // 沿 A 侧螺旋出去（略过圆心那点）
      sideA.slice(1).map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') +
      ` ${outerArc} ` +
      // 沿 B 侧螺旋回圆心
      sideB.slice().reverse().map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') +
      ' Z'

    return {
      d,
      color: COLORS[i % COLORS.length],
      /*
       * 用交替透明度做出糖丝的明暗层次。
       * 差值不要太大（1 vs 0.82），否则会出现明显的"色块拼接"感，
       * 和外围平滑的弧线放在一起不协调。
       */
      opacity: i % 2 === 0 ? 1 : 0.88,
    }
  })
})()

/* ---------- 旋转：JS 驱动，速度可切换且进度连续 ---------- */

/**
 * 当前旋转角度（度）。
 *
 * 为什么不用 CSS animation：
 *   之前靠 `.is-hover .fan__svg { animation-duration: 7s }` 加速，
 *   但改 duration 会让浏览器按新时长重新映射进度——
 *   比如原来转到 180°，切成 7s 后进度仍按 50% 算，角度会跳一下。
 *   而且 CSS 动画没有可读的"当前角度"，离开再回来无法从原处继续。
 *
 *   改成 JS 逐帧累加：角度是唯一真相，速度只是增量系数，
 *   切换速度时角度连续，不会跳。
 */
const angle = ref(0)

/** 正常速度：每毫秒转多少度（30s 一圈 ≈ 0.012 °/ms） */
const SPEED_NORMAL = 360 / 30000

/** 悬停速度：7s 一圈 ≈ 0.0514 °/ms，约 4.3 倍 */
const SPEED_HOVER = 360 / 7000

let raf = 0
let lastTs = 0
let reduced = false

function tick(ts: number) {
  raf = requestAnimationFrame(tick)
  if (!lastTs) {
    lastTs = ts
    return
  }
  const dt = ts - lastTs
  lastTs = ts

  /*
   * 只在"聚拢完成"之后才转，和之前的 is-assembled 时机一致。
   * 速度按 hovering 实时取，角度只做累加——
   * 这就是"触摸/未触摸共用同一份进度"的关键。
   */
  if (!assembled.value) return

  if (reduced) return

  const speed = hovering.value ? SPEED_HOVER : SPEED_NORMAL
  angle.value = (angle.value + speed * dt) % 360
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /*
   * 触发飞入的时机很关键。
   *
   * 之前是挂载后第一帧就 ready = true——DOM 从"远处"直接变成"就位"，
   * 浏览器来不及把初始状态画出来，transform 过渡等于被跳过，
   * 看起来就是"页面一加载就已经在那了"。
   *
   * 现在等两帧（确保初始态已经上屏）再触发，
   * 双 rAF 是最小且可靠的做法。
   */
  if (reduced) {
    ready.value = true
    timer = setTimeout(() => (assembled.value = true), 200)
    return
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ready.value = true
      // 等飞入基本完成后才开始自转
      timer = setTimeout(() => {
        assembled.value = true
      }, 1200)
    })
  })

  raf = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div
    class="fan"
    :class="{
      'is-ready': ready,
      'is-assembled': assembled,
      'is-hover': hovering,
    }"
    aria-hidden="true"
    @pointerenter="hovering = true"
    @pointerleave="hovering = false"
  >
    <div class="fan__glow" />

    <svg class="fan__svg" viewBox="0 0 400 400" fill="none">
      <defs>
        <!--
          渐变沿"圆心 → 尖端"方向铺：起点偏实，尖端渐隐。
          每片方向不同，所以要按各自角度算端点，不能共用竖直渐变。
        -->
        <linearGradient
          v-for="(p, i) in PETALS"
          :id="`petal-${i}`"
          :key="`g${i}`"
          :x1="p.startX"
          :y1="p.startY"
          :x2="p.tipX"
          :y2="p.tipY"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" :stop-color="p.color" stop-opacity="0.9" />
          <stop offset="48%" :stop-color="p.color" stop-opacity="1" />
          <stop offset="100%" :stop-color="p.color" stop-opacity="0.55" />
        </linearGradient>

        <!--
          糖面的立体明暗：中心提亮偏白，边缘压暗。
          叠在彩色扇形之上，把"平涂的披萨"变成"有弧度的糖球"。
        -->
        <radialGradient id="hub-shade" cx="40%" cy="34%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.42" />
          <stop offset="38%" stop-color="#ffffff" stop-opacity="0.08" />
          <stop offset="66%" stop-color="#000000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.3" />
        </radialGradient>

        <radialGradient id="petal-core">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
          <stop offset="42%" stop-color="#ffffff" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>

        <!--
          中心圆盘的彩虹渐变。
          中心提亮偏白（像花蕊的高光），向外依次过渡到橙、品红、
          青、蓝、紫，和外圈 12 条彩弧同一个色系。
          用 radialGradient 而不是纯色，是为了让中心有"发光"的层次。
        -->
      </defs>

      <!-- 花冠：七片等大的半圆花瓣，绕圆心均分 -->
      <!--
        旋转绑在这一层：角度由 JS 逐帧累加，
        速度切换只改变增量，不影响已有角度。
      -->
      <g
        class="fan__petals"
        :style="{ transform: `rotate(${angle}deg)` }"
      >
        <!--
          三层结构：
            外层 <g>  —— 只负责"从四面八方飞来"的位移
            中层 <g>  —— 固定按 i×30° 旋转到各自的方位
            内层 path —— 花瓣本体

          位移必须在旋转之前作用（外层），否则每片的飞行方向
          会跟着自己的方位一起转，看起来就全朝一个方向了。
        -->
        <g
          v-for="(p, i) in PETALS"
          :key="i"
          class="fan__fly"
          :class="{ 'is-in': ready }"
          :style="{
            '--fly-x': `${p.flyX}px`,
            '--fly-y': `${p.flyY}px`,
            '--fly-rot': `${p.flyRot}deg`,
            '--fly-delay': `${p.delay}ms`,
          }"
        >
        <g
          :transform="`rotate(${p.angle} ${CX} ${CY})`"
        >
          <!-- 外发光：同一条轮廓，粗而淡 -->
          <path
            class="fan__petal fan__petal--halo"
            :d="PETAL_PATH"
            :stroke="p.color"
            stroke-width="12"
            stroke-linejoin="round"
          />
          <!-- 花瓣轮廓线 -->
          <path
            class="fan__petal"
            :d="PETAL_PATH"
            :stroke="`url(#petal-${i})`"
            stroke-width="4"
            stroke-linecap="round"
            :style="{ transitionDelay: `${p.delay}ms` }"
          />
        </g>
        </g>
      </g>

      <!--
        中心圆：给七条弧一个共同的圆心轴。
        七条弧的起点都落在它的边缘（半径 HUB_R）上，
        所以这里必须和 HUB_R 一致，否则弧会脱离圆环。
      -->
      <g class="fan__hub">
        <!-- 外层柔光 -->
        <circle :cx="CX" :cy="CY" :r="HUB_R + 10" fill="url(#petal-core)" />

        <!--
          棒棒糖糖面：24 个扇形交替填色，自身也缓慢自转，
          看起来就像糖果表面的螺旋条纹在转。
        -->
        <g
          class="fan__hub-candy"
          :style="{ transform: `rotate(${angle * 1.6}deg)` }"
        >
          <path
            v-for="(w, i) in HUB_WEDGES"
            :key="i"
            :d="w.d"
            :fill="w.color"
            :fill-opacity="w.opacity"
            :stroke="w.color"
            stroke-width="0.5"
            stroke-opacity="0.6"
          />
        </g>

        <!--
          压一层径向渐变在上面：
          中心提亮、边缘收暗，糖面才有"球面"的立体感，
          否则平涂的扇形看着像切开的披萨。
        -->
        <circle :cx="CX" :cy="CY" :r="HUB_R" class="fan__hub-shade" />

        <!-- 圆环描边 -->
        <circle :cx="CX" :cy="CY" :r="HUB_R" class="fan__hub-ring" />

        <!-- 中心高光 -->
        <circle :cx="CX" :cy="CY" r="3.5" fill="#ffffff" fill-opacity="0.9" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.fan {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  pointer-events: auto;
}

/* ---------- 外层呼吸光晕 ---------- */
.fan__glow {
  position: absolute;
  inset: -8%;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(130, 165, 255, 0.16) 0%,
    rgba(170, 120, 255, 0.09) 40%,
    transparent 70%
  );
  filter: blur(26px);
  opacity: 0;
  transition: opacity 1.2s ease;
}

.is-assembled .fan__glow {
  opacity: 1;
  animation: glow-breathe 7s ease-in-out infinite;
}

@keyframes glow-breathe {
  0%,
  100% {
    opacity: 0.68;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.04);
  }
}

/* ---------- 整体旋转 ---------- */
.fan__svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  padding: 3px;
}

/* ---------- 中心圆 ---------- */
/* ---------- 棒棒糖糖面 ---------- */

.fan__hub-candy {
  /*
   * 扇形组自身缓慢自转（比外围花瓣快 1.6 倍），
   * 让糖面看起来在"转"，而不是一张静止的彩色贴图。
   */
  transform-box: view-box;
  transform-origin: 200px 200px;
  opacity: 0;
  transition: opacity 0.8s ease 0.15s;
  will-change: transform;
}

/*
 * 盖在扇形上的明暗层。
 * 中心偏白提亮、边缘压暗，平涂的扇形立刻有了球面体积感。
 */
.fan__hub-shade {
  fill: url(#hub-shade);
  opacity: 0;
  transition: opacity 0.8s ease 0.18s;
}

.fan__hub-ring {
  fill: none;
  /* 彩色底上用淡白描边，边界更利落；深色模式下也一样成立 */
  stroke: rgba(255, 255, 255, 0.55);
  stroke-width: 1.5;
  opacity: 0;
  transition: opacity 0.8s ease 0.25s;
}

.is-ready .fan__hub-candy {
  opacity: 1;
}

.is-ready .fan__hub-shade {
  opacity: 1;
}

.is-ready .fan__hub-ring {
  opacity: 0.55;
}

/* 悬停时圆环亮一点，呼应整体加速 */
.is-hover .fan__hub-ring {
  opacity: 0.9;
}

/* ---------- 飞入：从四面八方聚拢 ---------- */

/*
 * 每片花瓣的飞行层。
 *
 * 初始状态：沿自己方位推到 FLY_DIST 外，并且缩得很小、完全透明——
 * 视觉上就是"还没飞到"。聚拢后位移归零、恢复原尺寸。
 *
 * 用 transform 而不是改 d 或 left/top：transform 走合成层，
 * 12 片同时飞也不会掉帧。
 */
.fan__fly {
  opacity: 0;
  transform:
    translate(var(--fly-x), var(--fly-y))
    rotate(var(--fly-rot))
    scale(0.35);
  transform-origin: 200px 200px;
  transform-box: view-box;
  /* 入场：ease-out 收尾，像被"吸"到位置上 */
  transition:
    opacity 0.42s ease var(--fly-delay),
    transform 1.05s cubic-bezier(0.16, 1, 0.3, 1) var(--fly-delay);
  will-change: transform, opacity;
}

/* 聚拢完成 */
.fan__fly.is-in {
  opacity: 1;
  transform: translate(0, 0) rotate(0deg) scale(1);
}

/* ---------- 花瓣入场：从花心向外绽放 ---------- */
.fan__petal {
  opacity: 0;
  /* 弧长实测 ≈ 166.6（弦 150 + 鼓高 30.5，R≈107.5 的圆弧），
     dasharray 必须 ≥ 弧长，否则入场时尾部一开始就画出来了 */
  stroke-dasharray: 170;
  stroke-dashoffset: 170;
  transition:
    opacity 0.5s ease,
    stroke-dashoffset 0.95s cubic-bezier(0.33, 1, 0.68, 1);
}

.is-ready .fan__petal {
  opacity: 1;
  stroke-dashoffset: 0;
}

.fan__petals {
  /*
   * view-box 让 transform-origin 依据 viewBox 计算，
   * 200px 200px 正好是圆心——不能换成 fill-box，
   * 那样会以自身包围盒为基准，旋转中心就跑偏了。
   */
  transform-box: view-box;
  transform-origin: 200px 200px;
  /* 每帧都在改 transform，提前提升为合成层 */
  will-change: transform;
}

/* 外发光层 */
.fan__petal--halo {
  opacity: 0;
  filter: blur(8px);
  transform: none;
  transition: opacity 1s ease;
}

.is-assembled .fan__petal--halo {
  opacity: 0.34;
}

.is-hover .fan__petal--halo {
  opacity: 0.6;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1100px) {
  .fan {
    opacity: 0.85;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fan__svg,
  .is-assembled .fan__svg,
  .fan__glow,
  .is-assembled .fan__petals {
    animation: none !important;
  }
  .fan__petal {
    opacity: 1 !important;
    transform: none !important;
  }
  .is-assembled .fan__petal--halo {
    opacity: 0.34 !important;
  }
}
</style>
