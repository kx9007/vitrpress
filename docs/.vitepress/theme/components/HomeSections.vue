<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { pageUrl } from '../url'
import { profile, stats, skills, projects, posts, contacts } from '../../profile'
import ContactIcon from './ContactIcon.vue'
import TechOrbit from './TechOrbit.vue'

const year = computed(() => new Date().getFullYear())

/* ---------- 复制联系方式 ---------- */
const copied = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copy(c: { key: string; value: string }) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(c.value)
    } else {
      // 非安全上下文（http）下的降级方案
      const ta = document.createElement('textarea')
      ta.value = c.value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = c.key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = null), 1800)
  } catch {
    copied.value = null
  }
}

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
})

/* ---------- 指针视差：镜面高光跟随光标 ---------- */
const root = ref<HTMLElement | null>(null)
let raf = 0

function onPointerMove(e: PointerEvent) {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    const el = root.value
    if (!el) return
    const cards = el.querySelectorAll<HTMLElement>('.lg-glass')
    for (const card of cards) {
      const r = card.getBoundingClientRect()
      // 只处理视口内的卡片，减少无谓计算
      if (r.bottom < 0 || r.top > window.innerHeight) continue
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      card.style.setProperty('--mx', `${x}%`)
      card.style.setProperty('--my', `${y}%`)
    }
  })
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div ref="root" class="home">
    <!-- 彩虹极光背景：被玻璃折射的底色 -->
    <div class="aurora" aria-hidden="true">
      <span class="aurora__blob aurora__blob--1" />
      <span class="aurora__blob aurora__blob--2" />
      <span class="aurora__blob aurora__blob--3" />
      <span class="aurora__blob aurora__blob--4" />
      <span class="aurora__blob aurora__blob--5" />
      <span class="aurora__spectrum" />
      <span class="aurora__grain" />
    </div>

    <!-- 数据条 -->
    <section class="stats lg-glass">
      <div v-for="s in stats" :key="s.label" class="stat">
        <strong>{{ s.value }}</strong>
        <span>{{ s.label }}</span>
      </div>
    </section>

    <!-- 技术栈 -->
    <section class="home-section">
      <div class="home-section__head">
        <h2 class="home-section__title">
          <span class="home-section__dot" />
          技术栈
        </h2>
        <a class="home-section__more" :href="pageUrl('/about')">了解更多 →</a>
      </div>
      <!--
        技术栈用环绕球体呈现：图标沿球面自转，
        转背面时缩小淡出，替代原来那面文字标签墙。
      -->
      <div class="skills-orbit">
        <TechOrbit />
        <!-- 下方补一行分组说明，保留原 skills 的信息层次 -->
        <ul class="skills-legend">
          <li v-for="g in skills" :key="g.group" class="skills-legend__row">
            <span class="skills-legend__group">{{ g.group }}</span>
            <span class="skills-legend__items">{{ g.items.join(' · ') }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- 项目 -->
    <section class="home-section">
      <div class="home-section__head">
        <h2 class="home-section__title">
          <span class="home-section__dot" />
          精选项目
        </h2>
        <a class="home-section__more" :href="pageUrl('/projects')">全部项目 →</a>
      </div>
      <div class="cards">
        <a
          v-for="p in projects"
          :key="p.name"
          class="card lg-glass lg-glass--interactive"
          :href="p.link"
          target="_blank"
          rel="noreferrer"
        >
          <div class="card__top">
            <h3 class="card__title">{{ p.name }}</h3>
            <span class="card__stars"><svg class="star-icon" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95Z" fill="currentColor"/></svg> {{ p.stars }}</span>
          </div>
          <p class="card__desc">{{ p.desc }}</p>
          <div class="card__tags">
            <span v-for="t in p.tags" :key="t" class="tag tag--sm">{{ t }}</span>
          </div>
        </a>
      </div>
    </section>

    <!-- 文章 -->
    <section class="home-section">
      <div class="home-section__head">
        <h2 class="home-section__title">
          <span class="home-section__dot" />
          最近写作
        </h2>
        <a class="home-section__more" :href="pageUrl('/blog/')">全部文章 →</a>
      </div>
      <div class="posts lg-glass">
        <a v-for="post in posts" :key="post.link" class="post" :href="post.link">
          <span v-if="post.cover" class="post__cover">
            <img
              :src="post.cover"
              :alt="post.title"
              loading="lazy"
              decoding="async"
              width="480"
              height="270"
            />
          </span>
          <div class="post__body">
            <time>{{ post.date }}</time>
            <h3>{{ post.title }}</h3>
            <p>{{ post.desc }}</p>
          </div>
        </a>
      </div>
    </section>

    <!-- 联系 -->
    <footer class="home-footer-wrap">
      <div class="cta__inner">
        <h2>有想法，一起聊聊</h2>
        <p>无论是合作项目、技术交流，还是只是想打个招呼，都欢迎给我发邮件。</p>
        <a class="lg-btn" :href="`mailto:${profile.email}`">
          {{ profile.email }}
        </a>

        <!--
          联系方式的图标行。
          桌面端是"图标 + 名称 + 账号"的小卡片；
          移动端收成纯图标、每行 3 个，不放文字——
          这些平台图标本身就够识别，堆 9 行文字太占屏。
        -->
        <div class="contacts">
          <component
            :is="c.kind === 'link' ? 'a' : 'button'"
            v-for="c in contacts"
            :key="c.key"
            class="contact"
            :class="`contact--${c.key}`"
            :href="c.kind === 'link' ? c.href : undefined"
            :target="c.kind === 'link' ? '_blank' : undefined"
            :rel="c.kind === 'link' ? 'noreferrer' : undefined"
            :type="c.kind === 'copy' ? 'button' : undefined"
            :aria-label="c.kind === 'copy' ? `${c.hint}：${c.value}` : c.name"
            @click="c.kind === 'copy' && copy(c)"
          >
            <span class="contact__icon">
              <ContactIcon :name="c.key" />
            </span>
            <span class="contact__body">
              <span class="contact__name">{{ c.name }}</span>
              <span class="contact__value">{{ c.value }}</span>
            </span>
            <span v-if="c.kind === 'copy'" class="contact__action">
              {{ copied === c.key ? '已复制' : '复制' }}
            </span>
            <span v-else class="contact__arrow" aria-hidden="true">↗</span>
          </component>
        </div>
      </div>
    </footer>

    <p class="home-footer">© {{ year }} {{ profile.name }} · 用 VitePress 构建</p>
  </div>
</template>

<style scoped>
/* =========================================================
   容器
   ========================================================= */
.home {
  position: relative;
  max-width: 1152px;
  margin: 0 auto;
  padding: 24px 24px 56px;
}

.home-section {
  position: relative;
  margin-top: 64px;
}

/* 给下方区块补一点局部彩虹柔光，避免玻璃覆盖在纯灰底上失去通透感 */
.home-section::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: 12%;
  top: 8%;
  width: 76%;
  height: 84%;
  border-radius: 50%;
  pointer-events: none;
  background:
    /* 主题色薄底：让中段背景始终带一点本主题的色彩，不塌成灰 */
    radial-gradient(60% 70% at 50% 50%, color-mix(in srgb, var(--rb-5) 5%, transparent), transparent 78%),
    radial-gradient(46% 60% at 18% 30%, var(--soft-1), transparent 70%),
    radial-gradient(42% 58% at 78% 40%, var(--soft-2), transparent 70%),
    radial-gradient(44% 60% at 52% 88%, var(--soft-3), transparent 72%);
  filter: blur(30px);
}

.home-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.home-section__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 0;
  font-size: 21px;
  font-weight: 680;
  letter-spacing: -0.025em;
  color: var(--vp-c-text-1);
  border-top: 0;
}

/* 标题前的彩虹小点 */
.home-section__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    var(--rb-1),
    var(--rb-2),
    var(--rb-3),
    var(--rb-4),
    var(--rb-5),
    var(--rb-6),
    var(--rb-7),
    var(--rb-8),
    var(--rb-1)
  );
  box-shadow: 0 0 10px var(--accent-glow);
}

.home-section__more {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.home-section__more:hover {
  color: var(--vp-c-brand-1);
}

/* =========================================================
   彩虹极光背景
   ========================================================= */
.aurora {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  /* 避免内部 blob 撑出横向滚动条 */
  contain: strict;
}

.aurora__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.34;
  will-change: transform;
}

.aurora__blob--1 {
  width: 46vw;
  height: 46vw;
  top: -14vw;
  left: -8vw;
  background: radial-gradient(circle, var(--aurora-1), transparent 68%);
  opacity: 0.44;
  animation: drift-1 26s ease-in-out infinite;
}

.aurora__blob--2 {
  width: 40vw;
  height: 40vw;
  top: 4vw;
  right: -10vw;
  background: radial-gradient(circle, var(--aurora-2), transparent 68%);
  opacity: 0.36;
  animation: drift-2 30s ease-in-out infinite;
}

.aurora__blob--3 {
  width: 52vw;
  height: 52vw;
  top: 38vh;
  left: 18vw;
  background: radial-gradient(circle, var(--aurora-3), transparent 70%);
  opacity: 0.2;
  animation: drift-3 34s ease-in-out infinite;
}

.aurora__blob--4 {
  width: 44vw;
  height: 44vw;
  top: 60vh;
  right: -6vw;
  background: radial-gradient(circle, var(--aurora-4), transparent 70%);
  opacity: 0.26;
  animation: drift-4 28s ease-in-out infinite;
}

.aurora__blob--5 {
  width: 40vw;
  height: 40vw;
  top: 96vh;
  left: -6vw;
  background: radial-gradient(circle, var(--aurora-5), transparent 70%);
  opacity: 0.28;
  animation: drift-2 32s ease-in-out infinite reverse;
}

.aurora__grain {
  position: absolute;
  inset: 0;
  opacity: 0.28;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}

/* 彩虹光谱带：有锐利边界的色带。
   玻璃覆盖其上时，blur 才会产生真正的磨砂/折射观感，
   而没有玻璃的地方则保持清晰，形成"看穿玻璃"的层次。 */
.aurora__spectrum {
  position: absolute;
  top: 0;
  left: -20%;
  width: 140%;
  height: 100%;
  opacity: 0.34;
  background:
    linear-gradient(
      74deg,
      transparent 8%,
      var(--rb-a-1) 16%,
      var(--rb-a-2) 24%,
      var(--rb-a-3) 29%,
      var(--rb-a-4) 40%,
      var(--rb-a-5) 49%,
      var(--rb-a-6) 58%,
      var(--rb-a-7) 66%,
      var(--rb-a-8) 74%,
      transparent 84%
    );
  -webkit-mask-image: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.55) 40%,
    transparent 88%
  );
  mask-image: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.55) 40%,
    transparent 88%
  );
  filter: blur(2px) saturate(120%);
  transform: rotate(-9deg) scale(1.1);
}

@keyframes drift-1 {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(6vw, 5vh, 0) scale(1.12);
  }
}

@keyframes drift-2 {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1.05);
  }
  50% {
    transform: translate3d(-5vw, 7vh, 0) scale(1);
  }
}

@keyframes drift-3 {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-7vw, -6vh, 0) scale(1.15);
  }
}

@keyframes drift-4 {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1.08);
  }
  50% {
    transform: translate3d(4vw, -8vh, 0) scale(1);
  }
}

/* =========================================================
   彩虹文字
   ========================================================= */
.rb-text {
  background: var(--rb-text);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: rb-shift 9s ease-in-out infinite;
}

@keyframes rb-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* =========================================================
   数据条
   ========================================================= */
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 8px;
  padding: 26px 8px;
  border-radius: var(--hp-radius);
  background: var(--hp-card-bg);
  border: var(--hp-border);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  position: relative;
}

/* 用渐变细线代替生硬的实线分隔 */
.stat + .stat::before {
  content: '';
  position: absolute;
  left: 0;
  top: 22%;
  height: 56%;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(60, 70, 100, 0.16),
    transparent
  );
}

.stat strong {
  font-size: 26px;
  font-weight: 720;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-1);
}

.stat span {
  margin-top: 2px;
  font-size: 12.5px;
  letter-spacing: 0.01em;
  color: var(--vp-c-text-2);
  opacity: 0.78;
}

/* =========================================================
   技术栈（环绕球体）
   ========================================================= */
.skills-orbit {
  display: grid;
  grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
  align-items: center;
  /* 球体本身已有 8% 的内边距，这里不用再留太大的列间距 */
  gap: 18px;
  margin-top: 4px;
}

/* 右侧的分组说明：小字、克制的分隔，不抢球体的视觉重心 */
.skills-legend {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.skills-legend__row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: baseline;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.skills-legend__row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.skills-legend__group {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  letter-spacing: 0.04em;
}

.skills-legend__items {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

/* =========================================================
   联系方式
   ========================================================= */
/*
 * 联系方式
 *
 * 桌面端：3 列的"图标 + 名称 + 账号"卡片，放在 CTA 按钮下方。
 * 移动端：收成纯图标、每行 3 个（见文件末尾的 640 断点）。
 *   之所以不在移动端保留文字，是因为 9 个平台堆成 9 行会占满一整屏，
 *   而这些图标本身识别度足够。
 */
.contacts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 28px;
  /* 从 CTA 的居中布局里拉回左对齐 */
  text-align: left;
}

.contact {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  font: inherit;
  text-align: left;
  text-decoration: none;
  color: var(--vp-c-text-1);
  background: var(--hp-card-bg);
  border: var(--hp-border);
  border-radius: var(--hp-radius);
  cursor: pointer;
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease;
}

.contact__icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  color: #fff;
  border-radius: 11px;
  background: rgba(120, 130, 160, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 2px 6px -2px rgba(16, 24, 40, 0.2);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.contact:hover .contact__icon {
  transform: scale(1.06);
}

/* 每个平台用品牌色，深浅两种模式下都保持足够对比 */
.contact--qq .contact__icon {
  background: linear-gradient(145deg, #3ba7ef, #1c7ed6);
}
.contact--wechat .contact__icon {
  background: linear-gradient(145deg, #3ecf6d, #1aad4e);
}
.contact--email .contact__icon {
  background: linear-gradient(145deg, #7c8ba1, #57616f);
}
.contact--github .contact__icon {
  background: linear-gradient(145deg, #3d4149, #17191d);
}
.contact--gitee .contact__icon {
  background: linear-gradient(145deg, #f2545b, #c9302c);
}
.contact--youtube .contact__icon {
  background: linear-gradient(145deg, #ff4d4d, #d91f1f);
}
.contact--x .contact__icon {
  background: linear-gradient(145deg, #2f3338, #08090a);
}
.contact--instagram .contact__icon {
  background: linear-gradient(135deg, #f9ce34, #ee2a7b 50%, #6228d7);
}
.contact--tiktok .contact__icon {
  background: linear-gradient(145deg, #2b2d31, #0c0d0f);
  position: relative;
}

.contact__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.contact__name {
  font-size: 13.5px;
  font-weight: 620;
  letter-spacing: -0.005em;
  line-height: 1.3;
}

.contact__value {
  font-size: 12px;
  line-height: 1.3;
  color: var(--vp-c-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact__action {
  flex: 0 0 auto;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 560;
  color: var(--vp-c-text-3);
  background: rgba(128, 128, 160, 0.12);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.contact:hover .contact__action {
  color: var(--vp-c-text-1);
  background: rgba(128, 128, 160, 0.2);
}

.contact__arrow {
  flex: 0 0 auto;
  font-size: 13px;
  color: var(--vp-c-text-3);
  opacity: 0.7;
  transition: all 0.3s ease;
}

.contact:hover .contact__arrow {
  opacity: 1;
  transform: translate(1px, -1px);
}

.contacts__tip {
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.dark .contact__icon {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 2px 8px -2px rgba(0, 0, 0, 0.5);
  /* 深色下品牌色压一点亮度，避免在黑底上过跳 */
  filter: saturate(0.88) brightness(0.92);
}

.dark .contact__value {
  color: var(--vp-c-text-2);
}

/* 纯黑系图标（X / TikTok / GitHub）在深色下加一圈浅边，避免糊进背景 */
.dark .contact--x .contact__icon,
.dark .contact--tiktok .contact__icon,
.dark .contact--github .contact__icon {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.dark .contact__action {
  background: rgba(255, 255, 255, 0.1);
}

.dark .contact:hover .contact__action {
  background: rgba(255, 255, 255, 0.16);
}

/* =========================================================
   技术栈
   ========================================================= */
/* 技术栈已改为 TechOrbit 球体，原 .skills 网格与 .skill-group 卡片样式废弃 */
.tag {
  display: inline-block;
  padding: 4px 9px;
  font-size: 12px;
  color: var(--vp-c-text-1);
  background: rgba(128, 128, 160, 0.1);
  border: 1px solid rgba(128, 128, 160, 0.1);
  border-radius: 7px;
  white-space: nowrap;
}

.dark .tag {
  background: rgba(255, 255, 255, 0.13);
  border-color: rgba(255, 255, 255, 0.18);
  color: #eef0f6;
}

.tag--sm {
  font-size: 11px;
  padding: 3px 7px;
}

/* =========================================================
   项目卡片
   ========================================================= */
.cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.card {
  display: flex;
  flex-direction: column;
  padding: 22px;
  text-decoration: none;
  border-radius: var(--hp-radius);
}

.card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card__title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 660;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  word-break: break-all;
}

.card__stars {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.card__desc {
  flex: 1;
  margin: 10px 0 16px;
  min-height: 72px;
  font-size: 13.5px;
  line-height: 1.72;
  color: var(--vp-c-text-2);
}

.card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* =========================================================
   文章列表
   ========================================================= */
.posts {
  display: grid;
  /* 列数随容器宽度自适应：默认 3 列，窄屏自动降到 2 列 / 1 列 */
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 14px;
  padding: 12px;
  border-radius: var(--hp-radius);
}

.post {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  text-decoration: none;
  border: 1px solid rgba(128, 128, 160, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.42);
  transition:
    background 0.35s cubic-bezier(0.4, 0.8, 0.4, 1),
    border-color 0.35s ease,
    transform 0.4s cubic-bezier(0.3, 0.9, 0.3, 1);
}

.dark .post {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

.post:hover {
  background: rgba(128, 128, 160, 0.09);
  border-color: var(--vp-c-brand-1);
  transform: translateY(-3px);
}

.dark .post:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* ---------- 缩略图 ---------- */

.post__cover {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--vp-c-default-soft);
}

.post__cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 首屏之外不参与合成，滚动更省 */
  will-change: auto;
  transition: transform 0.7s cubic-bezier(0.3, 0.9, 0.3, 1);
}

.post:hover .post__cover img {
  transform: scale(1.055);
}

/* 底部压一层暗角，让标题文字和图片交界不生硬 */
.post__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 62%, rgba(8, 10, 16, 0.16));
  pointer-events: none;
}

.post__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 13px 15px 15px;
}

.post time {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-3);
  order: 0;
}

.post h3 {
  margin: 6px 0 0;
  font-size: 15px;
  font-weight: 620;
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  transition: color 0.3s ease;
  /* 两行封顶，避免长短标题把卡片高度拉不齐 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post:hover h3 {
  color: var(--vp-c-brand-1);
}

.post p {
  margin: 6px 0 0;
  font-size: 12.8px;
  line-height: 1.66;
  color: var(--vp-c-text-2);
  opacity: 0.92;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* =========================================================
   CTA
   ========================================================= */
/*
 * 联系区域现在并入页脚：
 * 不再是一张独立卡片，改为页脚上方的收尾块，
 * 上方用渐隐分隔线隔开，视觉上与版权行连成一体。
 */
.home-footer-wrap {
  position: relative;
  margin-top: 56px;
  padding-top: 36px;
}

/* 顶部渐隐分隔线 */
.home-footer-wrap::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 60%;
  max-width: 520px;
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(
    90deg,
    transparent,
    var(--vp-c-divider) 30%,
    var(--vp-c-divider) 70%,
    transparent
  );
}

/* 保留 .cta 只用于内部排版（标题/正文/按钮），去掉卡片壳 */
.cta {
  padding: 0;
  overflow: visible;
}

.cta__inner {
  position: relative;
  padding: 44px 32px;
  text-align: center;
}

.cta h2 {
  margin: 0;
  padding: 0;
  font-size: 25px;
  font-weight: 720;
  letter-spacing: -0.025em;
  color: var(--vp-c-text-1);
  border-top: 0;
}

.cta p {
  max-width: 500px;
  margin: 12px auto 26px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--vp-c-text-2);
}

/* 彩虹按钮 */
.lg-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 26px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--vp-c-text-1);
  /* 与全站一致的浅色玻璃，而不是深色实体按钮 */
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 1px 1px rgba(16, 24, 40, 0.04),
    0 10px 24px -12px rgba(16, 24, 40, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition:
    transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.42s cubic-bezier(0.4, 0.8, 0.4, 1),
    background 0.35s ease;
}

.dark .lg-btn {
  color: var(--vp-c-text-1);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow:
    0 10px 24px -12px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

/* 彩虹细描边，作为唯一的彩色强调 */
.lg-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(
    100deg,
    var(--rb-7),
    var(--rb-5),
    var(--rb-4),
    var(--rb-3),
    var(--rb-7)
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.7;
  pointer-events: none;
}

/* hover：和全站一致的液态玻璃鼓起，不位移 */
.lg-btn:hover {
  transform: scale(1.03);
  background: rgba(255, 255, 255, 0.78);
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.06),
    0 8px 20px -10px rgba(16, 24, 40, 0.24),
    inset 0 2px 0 rgba(255, 255, 255, 1),
    inset 0 4px 8px -6px rgba(255, 255, 255, 1),
    inset 0 -2px 0 rgba(140, 155, 190, 0.25),
    inset 0 -12px 20px -16px rgba(30, 45, 80, 0.2);
}

.lg-btn:active {
  transform: scale(0.975);
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .lg-btn:hover {
  background: rgba(255, 255, 255, 0.17);
  box-shadow:
    0 8px 20px -10px rgba(0, 0, 0, 0.5),
    inset 0 2px 0 rgba(255, 255, 255, 0.28),
    inset 0 4px 8px -6px rgba(255, 255, 255, 0.2),
    inset 0 -2px 0 rgba(255, 255, 255, 0.08),
    inset 0 -12px 20px -16px rgba(0, 0, 0, 0.4);
}

/* =========================================================
   页脚
   ========================================================= */
.home-footer {
  position: relative;
  /* 上面已经是联系区，这里只留一点呼吸，不再画分隔线 */
  margin: 26px 0 0;
  padding-top: 0;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-3);
}

/* 收尾的渐隐分隔线，替代空白 */
.home-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 60%;
  max-width: 520px;
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--rb-7) 20%, transparent),
    color-mix(in srgb, var(--rb-5) 24%, transparent),
    color-mix(in srgb, var(--rb-7) 20%, transparent),
    transparent
  );
}

/* =========================================================
   响应式
   ========================================================= */
@media (max-width: 960px) {
  .skills-orbit {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
    justify-items: center;
  }
  .skills-legend {
    width: 100%;
    max-width: 520px;
  }
  /* 平板：仍保留文字，两列 */
  .contacts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .cards {
    grid-template-columns: minmax(0, 1fr);
  }
  .aurora__blob {
    filter: blur(64px);
    opacity: 0.42;
  }
}

@media (max-width: 640px) {
  .home {
    padding: 12px 16px 64px;
  }
  .home-section {
    margin-top: 46px;
  }
  .home-section__title {
    font-size: 18.5px;
  }
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 0;
    padding: 20px 6px;
  }
  .stat:nth-child(odd)::before {
    display: none;
  }
  .stat:nth-child(even)::before {
    display: block;
  }
  .skills-orbit {
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
    justify-items: center;
  }
  .skills-legend {
    width: 100%;
    gap: 10px;
  }
  .skills-legend__row {
    padding-bottom: 10px;
  }
  /*
   * 联系方式在手机上收成纯图标，每行 3 个。
   * 隐藏名称和账号，只留彩色图标——9 个图标三行就排完，
   * 不再像之前那样一行一个、一路铺满屏幕。
   */
  /*
   * 间距修正
   *
   * 之前用 3 个 1fr 列：容器约 307px，每列 95px，而图标只有 46px，
   * 于是横向留出近 50px 的空隙，看着"左右太远"；
   * 同时竖向 gap 只有 10px，三行挤在一起，显得"上下太近"。
   *
   * 改成固定列宽 + 居中：图标组收紧成 3×46 + 2×30 = 198px，
   * 竖向拉到 20px，横竖比例就顺了。
   */
  .contacts {
    grid-template-columns: repeat(3, 46px);
    justify-content: center;
    column-gap: 30px;
    row-gap: 20px;
    margin-top: 24px;
  }
  .contact {
    justify-content: center;
    gap: 0;
    padding: 0;
    /* 去掉卡片边框，只留图标本身，视觉更轻 */
    background: none;
    border: 0;
    border-radius: 0;
  }
  .contact__icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
  }
  .contact__icon :deep(svg) {
    width: 22px;
    height: 22px;
  }
  /* 文字全部隐藏 */
  .contact__body,
  .contact__action,
  .contact__arrow {
    display: none;
  }
  /* 触屏没有 hover，用按下反馈代替 */
  .contact:active .contact__icon {
    transform: scale(0.94);
  }
  .post {
    /* 卡片式布局下不再需要竖排和额外内边距，缩略图已自带比例 */
    padding: 0;
  }
  .post__body {
    padding: 11px 13px 13px;
  }
  .cta__inner {
    padding: 30px 18px 26px;
  }
  /* 手机上把按钮到图标的间距收紧，避免中间空一大块 */
  .cta p {
    margin: 10px auto 20px;
  }
  .contacts {
    margin-top: 20px;
  }
  .home-footer-wrap {
    margin-top: 44px;
    padding-top: 30px;
  }
  .home-footer {
    margin-top: 18px;
  }
  .cta h2 {
    font-size: 21px;
  }
}
</style>
