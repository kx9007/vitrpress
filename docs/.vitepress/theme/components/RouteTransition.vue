<script setup lang="ts">
/**
 * 路由切换动画（纯展示组件）
 *
 * 动画状态由 html 上的 .fx-out / .fx-in 类驱动，
 * 这两个类由 theme/index.ts 的 enhanceApp 里统一控制。
 * 组件本身不监听路由 —— 因为 Layout 会随路由重建，
 * 组件内的监听器会丢失，放在 enhanceApp 才是稳定的。
 */
</script>

<template>
  <div class="route-fx" aria-hidden="true">
    <!-- 斜切的彩虹光带扫过 -->
    <span class="route-fx__band" />
    <!-- 顶部细光条 -->
    <span class="route-fx__bar" />
  </div>
</template>

<style>
.route-fx {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  overflow: hidden;
}

.route-fx__band {
  position: absolute;
  inset: -20% -60%;
  opacity: 0;
  transform: translateX(-120%) skewX(-14deg);
  background: linear-gradient(
    100deg,
    transparent 0%,
    rgba(94, 234, 212, 0.5) 22%,
    rgba(129, 140, 248, 0.6) 44%,
    rgba(244, 114, 182, 0.5) 66%,
    transparent 88%
  );
  filter: blur(48px);
}

.route-fx__bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  opacity: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(94, 234, 212, 0.9),
    rgba(168, 85, 247, 0.9),
    transparent
  );
}

/* 扫出 */
html.fx-out .route-fx__band {
  animation: sweep 0.62s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}

html.fx-out .route-fx__bar {
  animation: bar-run 0.62s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}

/* 扫入时再来一次反向，形成"揭幕"感 */
html.fx-in .route-fx__band {
  animation: sweep-back 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes sweep {
  0% {
    opacity: 0;
    transform: translateX(-120%) skewX(-14deg);
  }
  30% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    transform: translateX(120%) skewX(-14deg);
  }
}

@keyframes sweep-back {
  0% {
    opacity: 0.5;
    transform: translateX(120%) skewX(14deg);
  }
  100% {
    opacity: 0;
    transform: translateX(-120%) skewX(14deg);
  }
}

@keyframes bar-run {
  0% {
    opacity: 0;
    transform: scaleX(0);
    transform-origin: left;
  }
  40% {
    opacity: 1;
    transform: scaleX(1);
    transform-origin: left;
  }
  100% {
    opacity: 0;
    transform: scaleX(1);
    transform-origin: left;
  }
}
</style>
