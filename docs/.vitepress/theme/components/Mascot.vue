<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 看板娘（左下角）
 *
 * 行为：
 *   - 固定在左下角，进入视口时从下方浮入
 *   - 点击角色 → 弹出对话气泡，文案轮换
 *   - 气泡右上角 × 关闭；关闭后角色仍在，可再次点击
 *   - 角色右下角有个"收起"按钮，收起后只剩一个小圆钮
 *   - 尊重 prefers-reduced-motion：不做浮动动画
 *
 * 关于定位：
 *   用 position: fixed 且 z-index 低于 VitePress 的导航栏，
 *   避免盖住下拉菜单和搜索框。
 */

interface Props {
  /** 角色图片地址 */
  src?: string
}

const props = withDefaults(defineProps<Props>(), {
  src: '/img/mascot.png',
})

/** 角色当前是否已浮入 */
const visible = ref(false)
/** 对话气泡是否显示 */
const talking = ref(false)
/** 是否被用户收起 */
const collapsed = ref(false)
/** 当前说第几句 */
const lineIndex = ref(0)

/**
 * 对话文案。
 * 保持短句、轻松，不涉及具体功能承诺，避免和页面真实内容冲突。
 */
const LINES = [
  '嗨，随便逛逛吧～',
  '右上角可以换主题色哦',
  '试试深色模式，晚上更舒服',
  '下面有我的 API 站点，去看看？',
  '所有页面都不用 emoji，全是手绘 SVG 图标',
  '喜欢的话，去 GitHub 点个星吧',
]

const currentLine = computed(() => LINES[lineIndex.value % LINES.length])

let hideTimer: ReturnType<typeof setTimeout> | null = null

function say() {
  if (collapsed.value) {
    // 收起状态下点小圆钮，先展开
    collapsed.value = false
    return
  }
  lineIndex.value = (lineIndex.value + 1) % LINES.length
  talking.value = true
  if (hideTimer) clearTimeout(hideTimer)
  // 6 秒后自动收起气泡，避免长期遮挡页面
  hideTimer = setTimeout(() => {
    talking.value = false
  }, 6000)
}

function closeBubble() {
  talking.value = false
  if (hideTimer) clearTimeout(hideTimer)
}

function collapse() {
  collapsed.value = true
  talking.value = false
  if (hideTimer) clearTimeout(hideTimer)
}

function expand() {
  collapsed.value = false
}

onMounted(() => {
  // 稍等一拍再浮入，避免和首屏其他动效抢时间
  requestAnimationFrame(() => {
    setTimeout(() => {
      visible.value = true
      // 首次进入主动打个招呼
      setTimeout(() => {
        talking.value = true
      }, 700)
    }, 400)
  })
})

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<template>
  <div
    class="mascot"
    :class="{
      'is-visible': visible,
      'is-talking': talking,
      'is-collapsed': collapsed,
    }"
  >
    <!-- 收起状态下的小圆钮 -->
    <button
      v-if="collapsed"
      class="mascot__tab"
      type="button"
      aria-label="展开看板娘"
      @click="expand"
    >
      <span class="mascot__tab-dot" />
    </button>

    <template v-else>
      <!-- 对话气泡 -->
      <transition name="bubble">
        <div v-if="talking" class="mascot__bubble" role="status">
          <button
            class="mascot__bubble-close"
            type="button"
            aria-label="关闭对话"
            @click="closeBubble"
          >
            ×
          </button>
          <p class="mascot__line">{{ currentLine }}</p>
        </div>
      </transition>

      <!-- 角色本体 -->
      <button
        class="mascot__body"
        type="button"
        aria-label="和看板娘说话"
        @click="say"
      >
        <img class="mascot__img" :src="props.src" alt="" draggable="false" />
      </button>

      <!-- 收起按钮 -->
      <button
        class="mascot__hide"
        type="button"
        aria-label="收起看板娘"
        @click="collapse"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            d="M3.5 6.5 8 11l4.5-4.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </template>
  </div>
</template>

<style scoped>
.mascot {
  /* 左右边距与角色宽度都用同一套变量，避免两处数值打架 */
  --mascot-gap: clamp(8px, 1.6vw, 26px);
  /* 首屏内容区固定 max-width: 1152px 且居中，两侧留白 = (100vw - 1152px) / 2 */
  --mascot-free: calc((100vw - 1152px) / 2);

  position: fixed;
  left: var(--mascot-gap);
  bottom: 0;
  /* 低于 VitePress 导航栏（其 z-index 约 30+），避免遮挡菜单 */
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  pointer-events: none;
  user-select: none;
}

.mascot > * {
  pointer-events: auto;
}

/* ---------- 角色本体 ---------- */

.mascot__body {
  display: block;
  /*
   * 宽度自适应：只在内容区左侧的留白里伸展。
   * 可用宽度 = 侧边留白 - 左边距 - 8px 安全间距，
   * 再用 132px 封顶避免大屏角色过大。
   * 这样角色右边缘永远落在正文左边界之外，不会压住文字和按钮。
   */
  width: min(132px, calc(var(--mascot-free) - var(--mascot-gap) - 8px));
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  /* 从下方浮入 */
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.62s ease,
    transform 0.62s cubic-bezier(0.22, 1, 0.36, 1);
}

.mascot.is-visible .mascot__body {
  opacity: 1;
  transform: translateY(0);
}

.mascot__img {
  display: block;
  width: 100%;
  height: auto;
  /* 让脚部自然贴住视口底边，不要悬空 */
  margin-bottom: -2px;
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.mascot__body:hover .mascot__img {
  transform: translateY(-6px) scale(1.02);
}

.mascot__body:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
  border-radius: 12px;
}

/* 轻微呼吸感，让角色不显得是张死图 */
.mascot.is-visible .mascot__img {
  animation: mascot-breathe 4.6s ease-in-out infinite;
}

@keyframes mascot-breathe {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

/* hover 时暂停呼吸，避免和上移冲突 */
.mascot__body:hover .mascot__img {
  animation: none;
}

/* ---------- 对话气泡 ---------- */

.mascot__bubble {
  position: relative;
  margin-bottom: 10px;
  margin-left: 6px;
  /*
   * 气泡向右只能长到正文左边界之前。
   * 可用宽度 = 侧边留白 - 左边距 - 气泡自身 6px 偏移 - 8px 安全间距。
   * 这里不设下限：下限会被撑出去压住按钮，宁可让文字窄一点。
   */
  max-width: min(
    232px,
    calc(var(--mascot-free) - var(--mascot-gap) - 6px - 8px)
  );
  padding: 10px 30px 10px 13px;
  background: var(--vp-c-bg-elv, var(--vp-c-bg));
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

/* 小尖角，指向角色 */
.mascot__bubble::after {
  content: '';
  position: absolute;
  left: 22px;
  bottom: -6px;
  width: 10px;
  height: 10px;
  background: var(--vp-c-bg-elv, var(--vp-c-bg));
  border-right: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  transform: rotate(45deg);
}

.mascot__line {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--vp-c-text-1);
}

.mascot__bubble-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.mascot__bubble-close:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

/* 气泡进出场 */
.bubble-enter-active,
.bubble-leave-active {
  transition:
    opacity 0.26s ease,
    transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}

.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}

/* ---------- 收起按钮 ---------- */

.mascot__hide {
  position: absolute;
  right: 4px;
  bottom: 10px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  background: var(--vp-c-bg-elv, var(--vp-c-bg));
  color: var(--vp-c-text-2);
  opacity: 0;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    background-color 0.2s ease;
}

.mascot:hover .mascot__hide,
.mascot__hide:focus-visible {
  opacity: 1;
}

.mascot__hide:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

/* ---------- 收起后的小圆钮 ---------- */

.mascot__tab {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  margin: 0 0 14px 10px;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  background: var(--vp-c-bg-elv, var(--vp-c-bg));
  cursor: pointer;
  transition:
    transform 0.22s ease,
    border-color 0.22s ease;
}

.mascot__tab:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
}

.mascot__tab-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
}

/* ---------- 响应式 ---------- */

/*
 * 看板娘寄生在"内容区左侧留白"里。
 * 内容区固定 max-width: 1152px 居中，所以视口窄于 1152 + 两侧最小
 * 可用宽度时就没有空间了，此时直接隐藏，避免压住正文。
 * 1366 及以下实测会挤到内容，故断点取 1400。
 */
@media (max-width: 1400px) {
  .mascot {
    display: none;
  }
}

/* ---------- 无障碍 ---------- */

@media (prefers-reduced-motion: reduce) {
  .mascot__body,
  .mascot__img,
  .mascot__tab {
    transition: none !important;
    animation: none !important;
  }

  .mascot__body {
    opacity: 1;
    transform: none;
  }
}
</style>
