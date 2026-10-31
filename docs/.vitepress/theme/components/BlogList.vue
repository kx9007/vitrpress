<script setup lang="ts">
/**
 * 博客列表页。
 *
 * 数据源与首页「最近写作」共用 profile.ts 的 posts，
 * 这样加文章只改一处，两处同时生效。
 *
 * 按年份分组，组内是带缩略图的卡片网格。
 * 列数交给 auto-fill：宽屏 3 列、平板 2 列、手机 1 列。
 */
import { computed } from 'vue'
import { posts } from '../../profile'

const groups = computed(() => {
  const map = new Map<string, typeof posts>()
  for (const p of posts) {
    const year = (p.date || '').slice(0, 4) || '其他'
    if (!map.has(year)) map.set(year, [])
    // @ts-expect-error 数组元素类型由 profile 推断
    map.get(year).push(p)
  }
  // 年份倒序
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
})
</script>

<template>
  <div class="blist">
    <section v-for="[year, items] in groups" :key="year" class="blist__year">
      <h2 class="blist__year-t">{{ year }}</h2>

      <div class="blist__grid">
        <a
          v-for="post in items"
          :key="post.link"
          class="bcard"
          :href="post.link"
        >
          <span class="bcard__cover">
            <img
              v-if="post.cover"
              :src="post.cover"
              :alt="post.title"
              loading="lazy"
              decoding="async"
              width="480"
              height="270"
            />
            <span v-else class="bcard__ph">{{ post.title.slice(0, 1) }}</span>
          </span>

          <span class="bcard__body">
            <time class="bcard__date">{{ post.date }}</time>
            <h3 class="bcard__title">{{ post.title }}</h3>
            <p class="bcard__desc">{{ post.desc }}</p>
            <span class="bcard__more">阅读全文 →</span>
          </span>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.blist {
  margin-top: 8px;
}

.blist__year + .blist__year {
  margin-top: 40px;
}

.blist__year-t {
  margin: 0 0 18px;
  padding: 0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-1);
  border: 0;
}

.blist__year-t::after {
  content: '';
  display: block;
  margin-top: 12px;
  height: 1px;
  background: linear-gradient(90deg, var(--vp-c-divider), transparent);
}

.blist__grid {
  display: grid;
  /* 230px 是能放下「日期+两行标题」的下限；容器够宽时自然升列 */
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 196px), 1fr));
  gap: 18px;
}

/* ---------- 卡片 ---------- */

.bcard {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  text-decoration: none;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  transition:
    transform 0.42s cubic-bezier(0.3, 0.9, 0.3, 1),
    border-color 0.35s ease,
    box-shadow 0.42s ease;
}

.bcard:hover {
  transform: translateY(-4px);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 16px 40px -20px rgba(10, 14, 26, 0.4);
}

/* 缩略图：固定 16:9，避免不同图源把卡片撑成不同高度 */
.bcard__cover {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--vp-c-default-soft);
}

.bcard__cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s cubic-bezier(0.3, 0.9, 0.3, 1);
}

.bcard:hover .bcard__cover img {
  transform: scale(1.06);
}

.bcard__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 62%, rgba(8, 10, 16, 0.16));
  pointer-events: none;
}

/* 没有封面时的占位：首字 + 渐变色块 */
.bcard__ph {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  opacity: 0.85;
}

.bcard__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding: 14px 16px 16px;
}

.bcard__date {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-3);
}

.bcard__title {
  margin: 7px 0 0;
  font-size: 15.5px;
  font-weight: 640;
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  transition: color 0.3s ease;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bcard:hover .bcard__title {
  color: var(--vp-c-brand-1);
}

.bcard__desc {
  margin: 7px 0 0;
  font-size: 13px;
  line-height: 1.68;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bcard__more {
  margin-top: auto;
  padding-top: 12px;
  font-size: 12.5px;
  font-weight: 560;
  color: var(--vp-c-brand-1);
  opacity: 0.72;
  transition: opacity 0.3s ease;
}

.bcard:hover .bcard__more {
  opacity: 1;
}

@media (max-width: 560px) {
  .blist__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .blist__year + .blist__year {
    margin-top: 32px;
  }
}
</style>
