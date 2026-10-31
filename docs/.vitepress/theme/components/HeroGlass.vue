<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { pageUrl } from '../url'

const heroRef = ref<HTMLElement | null>(null)
let raf = 0

/** 鼠标视差：玻璃块高光跟随光标，模拟 macOS 边缘反光 */
function onMove(e: PointerEvent) {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    const el = heroRef.value
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
    // 轻微倾斜，幅度极小，保持高级感而不要晃
    const tx = ((e.clientX - r.left) / r.width - 0.5) * 5
    const ty = ((e.clientY - r.top) / r.height - 0.5) * 5
    el.style.setProperty('--tilt-x', `${-ty}deg`)
    el.style.setProperty('--tilt-y', `${tx}deg`)
  })
}

onMounted(() => {
  const el = heroRef.value
  if (!el) return
  if (window.matchMedia('(hover: hover)').matches) {
    el.addEventListener('pointermove', onMove, { passive: true })
  }
})

onBeforeUnmount(() => {
  heroRef.value?.removeEventListener('pointermove', onMove)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="hero">
    <!-- 彩虹光晕：位于玻璃之后，被玻璃模糊折射 -->
    <div class="hero__halo" aria-hidden="true" />

    <div ref="heroRef" class="hero__card lg-glass">
      <div class="hero__inner">
        <!-- 左侧文字 -->
        <div class="hero__copy">
          <p class="hero__eyebrow">
            <span class="hero__pulse" />
            <span>你好，我是</span>
          </p>

          <h1 class="hero__name">
            <span class="rb-text">你的名字</span>
          </h1>

          <p class="hero__role">前端开发 / 独立开发者</p>

          <p class="hero__desc">
            专注于 Web 前端工程化与交互体验设计，喜欢把复杂的问题拆成简单的模块。这里是记录我做过的项目、写下的思考，以及正在学习的东西的地方。
          </p>

          <div class="hero__actions">
            <a class="btn btn--primary" :href="pageUrl('/projects')">
              <span>看看我的项目</span>
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
            <a class="btn btn--ghost" :href="pageUrl('/blog/')">
              <span>读读博客</span>
            </a>
          </div>

          <div class="hero__meta">
            <span class="hero__chip">
              <svg class="hero__chip-icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                <path
                  d="M12 2.2a7.1 7.1 0 0 0-7.1 7.1c0 5.1 6.2 11.7 6.5 12a.85.85 0 0 0 1.2 0c.3-.3 6.5-6.9 6.5-12A7.1 7.1 0 0 0 12 2.2Zm0 9.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z"
                  fill="currentColor"
                />
              </svg>
              中国 · 杭州
            </span>
            <span class="hero__chip">
              <span class="hero__live" />正在做：一个开源的组件库
            </span>
          </div>
        </div>
        <!-- 右侧头像：彩虹玻璃球 -->
        <div class="hero__avatar">
          <div class="orb">
            <span class="orb__dye" />
            <span class="orb__frost" />
            <span class="orb__ring" />
            <span class="orb__core">YN</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 滚动提示 -->
    <div class="hero__scroll" aria-hidden="true">
      <span />
    </div>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  max-width: 1152px;
  margin: 0 auto;
  padding: 56px 24px 8px;
  /* 光晕与球体阴影会向外扩散，这里裁掉避免撑出横向滚动 */
  overflow-x: clip;
}

/* ---------- 背景彩虹光晕 ---------- */
.hero__halo {
  position: absolute;
  top: -80px;
  left: 50%;
  width: 100%;
  height: 560px;
  transform: translateX(-50%);
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(38% 52% at 16% 30%, var(--rb-a-1), transparent 70%),
    radial-gradient(34% 46% at 40% 8%, var(--rb-a-2), transparent 70%),
    radial-gradient(32% 44% at 62% 14%, var(--rb-a-3), transparent 70%),
    radial-gradient(34% 46% at 82% 34%, var(--rb-a-4), transparent 70%),
    radial-gradient(36% 48% at 92% 66%, var(--rb-a-5), transparent 70%),
    radial-gradient(40% 54% at 62% 84%, var(--rb-a-6), transparent 70%),
    radial-gradient(36% 48% at 30% 82%, var(--rb-a-7), transparent 70%);
  filter: blur(52px) saturate(150%);
  opacity: 0.9;
}

/* ---------- 玻璃卡片 ---------- */
.hero__card {
  --lg-radius: 40px;
  padding: 2px;
  overflow: hidden;
  transform: perspective(1600px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));
  transition:
    transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.6s cubic-bezier(0.4, 0.8, 0.4, 1);
}

.hero__inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
  padding: 52px 52px 48px;
}

.hero__copy {
  max-width: 600px;
}

/* ----------  eyebrow ---------- */
.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 18px;
  font-size: 12.5px;
  font-weight: 560;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-2);
}

.hero__eyebrow::before {
  content: '';
  width: 22px;
  height: 1.5px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--rb-6), var(--rb-5), var(--rb-4));
}

.hero__pulse {
  display: none;
}

/* ---------- 姓名 ---------- */
.hero__name {
  margin: 0;
  font-size: clamp(40px, 5.4vw, 68px);
  line-height: 1.04;
  font-weight: 800;
  letter-spacing: -0.045em;
}

.hero__name .rb-text {
  /* 渐变由主题提供（themes.css 的 --rb-text），
     单色主题下是同色系的明暗流动，彩虹主题下是完整光谱 */
  background: var(--rb-text);
  background-size: 240% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: rb-shift 14s ease-in-out infinite;
  filter: drop-shadow(0 2px 18px color-mix(in srgb, var(--rb-6) 22%, transparent));
}

/* ---------- 角色 ---------- */
.hero__role {
  margin: 14px 0 0;
  font-size: 18px;
  font-weight: 620;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  opacity: 0.86;
}

.hero__desc {
  margin: 16px 0 0;
  font-size: 15px;
  line-height: 1.86;
  font-weight: 420;
  color: var(--vp-c-text-1);
  opacity: 0.78;
  max-width: 540px;
}

/* ---------- 按钮 ---------- */
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 44px;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 580;
  letter-spacing: -0.005em;
  text-decoration: none;
  border-radius: 999px;
  transition:
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.45s ease,
    background 0.45s ease;
}

.btn--primary {
  position: relative;
  color: #fff;
  /* 着色玻璃：半透明蓝紫 + 内高光，而不是平涂实心色 */
  background: var(--accent-grad);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  backdrop-filter: blur(14px) saturate(180%);
  box-shadow:
    0 10px 24px -10px var(--accent-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.36),
    inset 0 -8px 18px -12px rgba(8, 20, 60, 0.5);
}

.btn--primary::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(106deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0) 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 58%);
  pointer-events: none;
}

.btn--primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 14px 30px -10px var(--accent-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn--ghost {
  color: var(--vp-c-text-1);
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  backdrop-filter: blur(14px) saturate(160%);
  box-shadow: 0 2px 8px -3px rgba(16, 24, 40, 0.1);
}

.dark .btn--ghost {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.14);
}

.btn--ghost:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 22px -10px rgba(16, 24, 40, 0.2);
}

.dark .btn--ghost:hover {
  background: rgba(255, 255, 255, 0.11);
}

/* ---------- meta chips ---------- */
.hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}

.hero__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  background: rgba(255, 255, 255, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.56);
  border-radius: 999px;
}

.dark .hero__chip {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.hero__chip-icon {
  flex: 0 0 auto;
  opacity: 0.7;
}

.hero__live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--rb-6);
  box-shadow: 0 0 8px var(--accent-glow);
}

/* ---------- 头像球 ---------- */
.hero__avatar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  padding-right: 6px;
}

.orb {
  position: relative;
  display: grid;
  place-items: center;
  width: 224px;
  height: 224px;
  border-radius: 50%;
  overflow: hidden;
  isolation: isolate;
  box-shadow:
    /* 贴地紧实的投影 */
    0 16px 30px -16px rgba(30, 46, 92, 0.36),
    0 4px 10px -6px rgba(30, 46, 92, 0.22),
    /* 底部深色折射带：玻璃厚度 */
    inset 0 -30px 32px -26px rgba(14, 20, 46, 0.5),
    /* 顶部细亮折射弧 */
    inset 0 3px 2px -1px rgba(255, 255, 255, 0.8);
  animation: orb-float 8s ease-in-out infinite;
}

/* 球内色层：真实存在的彩色内容，供上层毛玻璃折射 */
.orb__dye {
  position: absolute;
  inset: -8%;
  z-index: 0;
  border-radius: 50%;
  background:
    radial-gradient(46% 48% at 22% 26%, var(--orb-1) 0%, transparent 72%),
    radial-gradient(48% 46% at 80% 20%, var(--orb-2) 0%, transparent 72%),
    radial-gradient(50% 48% at 78% 80%, var(--orb-3) 0%, transparent 74%),
    radial-gradient(46% 48% at 24% 82%, var(--orb-4) 0%, transparent 74%),
    linear-gradient(
      150deg,
      color-mix(in srgb, var(--orb-1) 82%, #101426),
      color-mix(in srgb, var(--orb-2) 78%, #101426) 55%,
      color-mix(in srgb, var(--orb-3) 76%, #101426)
    );
  filter: blur(16px) saturate(115%);
}

/* 毛玻璃层：悬浮在色层之上，把色层折射成雾面光谱 */
.orb__frost {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: 50%;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23f)' opacity='0.18'/%3E%3C/svg%3E"),
    rgba(255, 255, 255, 0.1);
  background-blend-mode: overlay;
  -webkit-backdrop-filter: blur(14px) saturate(190%) brightness(1.18);
  backdrop-filter: blur(14px) saturate(190%) brightness(1.18);
}

/* 边缘色散环：玻璃球最标志性的一笔 */
.orb__ring {
  position: absolute;
  inset: 0;
  z-index: 4;
  border-radius: 50%;
  padding: 1px;
  background: conic-gradient(
    from 200deg,
    rgba(140, 160, 245, 1),
    rgba(90, 215, 235, 1),
    rgba(120, 225, 150, 1),
    rgba(250, 215, 120, 1),
    rgba(240, 140, 200, 1),
    rgba(140, 160, 245, 1)
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.85;
  pointer-events: none;
  /* 让环只在边缘浮现，向内淡出，避免"描边感" */
  -webkit-mask-image: radial-gradient(circle, transparent 82%, #000 96%);
  mask-image: radial-gradient(circle, transparent 82%, #000 96%);
}

/* 主镜面高光：锐利小块反光，玻璃而非塑料的关键 */
.orb::before {
  content: '';
  position: absolute;
  top: 6%;
  left: 15%;
  width: 28%;
  height: 18%;
  border-radius: 50%;
  z-index: 5;
  background: radial-gradient(
    ellipse at 44% 36%,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.7) 30%,
    rgba(255, 255, 255, 0.08) 60%,
    transparent 72%
  );
  filter: blur(1px);
  pointer-events: none;
}

/* 底部焦散光：光穿过球体在下缘形成的亮弧 */
.orb::after {
  content: '';
  position: absolute;
  left: 16%;
  bottom: 3%;
  width: 68%;
  height: 12%;
  border-radius: 50%;
  z-index: 3;
  background: radial-gradient(
    ellipse at 50% 56%,
    rgba(255, 255, 255, 0.62),
    rgba(190, 210, 245, 0.18) 52%,
    transparent 74%
  );
  filter: blur(3px);
  pointer-events: none;
}

/* 内胆：透明玻璃片，透出下方光谱 */
.orb__core {
  position: relative;
  display: grid;
  place-items: center;
  width: 142px;
  height: 142px;
  font-size: 44px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
  border-radius: 50%;
  background: transparent;
  border: 0;
  text-shadow:
    0 1px 14px rgba(10, 14, 40, 0.35),
    0 0 1px rgba(255, 255, 255, 0.5);
  box-shadow: none;
  z-index: 3;
}


/* ---------- 滚动提示 ---------- */
.hero__scroll {
  display: grid;
  place-items: center;
  margin-top: 26px;
  height: 34px;
  opacity: 0.5;
}

.hero__scroll span {
  width: 1px;
  height: 28px;
  background: linear-gradient(180deg, transparent, var(--vp-c-text-3));
  animation: scroll-hint 2.4s ease-in-out infinite;
}

@keyframes scroll-hint {
  0%,
  100% {
    opacity: 0.2;
    transform: scaleY(0.6);
  }
  50% {
    opacity: 1;
    transform: scaleY(1);
  }
}

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
  .hero {
    padding: 36px 16px 4px;
  }
  /* 头像不再单独占一行：保持左右并排，只缩小尺寸 */
  .hero__inner {
    flex-direction: row;
    align-items: center;
    gap: 22px;
    padding: 30px 22px 28px;
  }
  .hero__card {
    --lg-radius: 32px;
  }
  .hero__copy {
    flex: 1 1 auto;
    min-width: 0;
  }
  .orb {
    width: 112px;
    height: 112px;
  }
  .orb__core {
    width: 72px;
    height: 72px;
    font-size: 26px;
  }
  .hero__desc {
    max-width: none;
  }
  .hero__halo {
    height: 420px;
    width: 100%;
    filter: blur(40px) saturate(150%);
  }
}

@media (max-width: 560px) {
  /*
   * 窄屏下并排会把文字挤成一列窄条，
   * 所以让头像脱离文档流贴到右上角，正文照常占满宽度。
   */
  .hero__inner {
    position: relative;
    display: block;
    padding: 26px 18px 24px;
  }
  .hero__copy {
    min-width: 0;
  }
  .hero__avatar {
    position: absolute;
    top: 22px;
    right: 18px;
    padding: 0;
    z-index: 2;
  }
  /* 给右上角头像让出空间，避免标题压到球体上 */
  .hero__copy {
    padding-right: 96px;
  }
  /* 简介首行也要避开球体，否则会被压住 */
  .hero__desc {
    padding-right: 0;
    max-width: none;
    /* 球体右上，简介左对齐时只挡到前一两行，用 text-indent 无效，
       这里给整段一个较小的右侧留白，保证不侵入球体范围 */
    margin-right: -78px;
    padding-right: 78px;
  }
  /* 按钮与标签在球体下方，恢复满宽 */
  .hero__actions,
  .hero__meta {
    padding-right: 0;
    margin-right: 0;
    max-width: none;
  }
  .hero__name {
    font-size: 34px;
  }
  .hero__role {
    font-size: 15.5px;
  }
  .hero__desc {
    font-size: 14px;
    line-height: 1.78;
  }
  .btn {
    height: 42px;
    padding: 0 18px;
    font-size: 13.5px;
  }
  .orb {
    width: 80px;
    height: 80px;
  }
  .orb__core {
    width: 52px;
    height: 52px;
    font-size: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .orb,
  .hero__pulse,
  .hero__scroll span,
  .hero__name .rb-text {
    animation: none !important;
  }
}
</style>
