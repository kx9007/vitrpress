<script setup lang="ts">
import { ref, computed } from 'vue'
import { navGroups } from '../../profile'
import NavIcon from './NavIcon.vue'

const keyword = ref('')

/* 把所有站点拍平，便于搜索 */
const allItems = computed(() =>
  navGroups.flatMap((g) =>
    g.items.map((it) => ({ ...it, group: g.title }))
  )
)

/* 搜索：匹配名称、描述、标签、分组名 */
const matched = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return null
  return allItems.value.filter((it) =>
    [it.name, it.desc, it.tag, it.group]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(k))
  )
})

/* 无搜索时按分组展示；如果某组在当前过滤下为空则隐藏 */
const visibleGroups = computed(() => {
  if (matched.value) return []
  return navGroups
    .map((g) => ({
      ...g,
      items: g.items,
    }))
    .filter((g) => g.items.length > 0)
})

const total = computed(() => allItems.value.length)

function clearSearch() {
  keyword.value = ''
}
</script>

<template>
  <div class="navsite">
    <!-- 搜索 -->
    <div class="search">
      <svg class="search__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d="M10.5 3a7.5 7.5 0 1 0 4.55 13.46l4.24 4.24a1 1 0 0 0 1.42-1.42l-4.24-4.24A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z"
          fill="currentColor"
        />
      </svg>
      <input
        v-model="keyword"
        type="search"
        class="search__input"
        placeholder="搜索站点名称、描述或分类…"
        aria-label="搜索站点"
      />
      <button
        v-if="keyword"
        type="button"
        class="search__clear"
        aria-label="清除搜索"
        @click="clearSearch"
      >
        <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <span v-else class="search__hint">{{ total }} 个站点</span>
    </div>

    <!-- 搜索结果 -->
    <template v-if="matched">
      <p class="result-bar">
        找到 <strong>{{ matched.length }}</strong> 个结果
      </p>
      <div v-if="matched.length" class="grid">
        <component
          :is="it.internal ? 'a' : 'a'"
          v-for="it in matched"
          :key="it.name + it.url"
          class="site lg-glass"
          :href="it.url"
          :target="it.internal ? undefined : '_blank'"
          :rel="it.internal ? undefined : 'noreferrer noopener'"
        >
          <span class="site__icon">
            <NavIcon :name="it.icon" />
          </span>
          <span class="site__body">
            <span class="site__name">
              {{ it.name }}
              <span v-if="it.featured" class="site__star" title="常用"><svg class="star-icon" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95Z" fill="currentColor"/></svg></span>
            </span>
            <span class="site__desc">{{ it.desc }}</span>
          </span>
          <span class="site__tag">{{ it.tag }}</span>
        </component>
      </div>
      <p v-else class="empty">没有匹配的站点，换个关键词试试。</p>
    </template>

    <!-- 分组展示 -->
    <template v-else>
      <section v-for="g in visibleGroups" :key="g.title" class="navgroup">
        <header class="navgroup__head">
          <h2 class="navgroup__title">{{ g.title }}</h2>
          <span class="navgroup__desc">{{ g.desc }}</span>
          <span class="navgroup__count">{{ g.items.length }}</span>
        </header>

        <div class="grid">
          <a
            v-for="it in g.items"
            :key="it.name"
            class="site lg-glass"
            :href="it.url"
            :target="it.internal ? undefined : '_blank'"
            :rel="it.internal ? undefined : 'noreferrer noopener'"
          >
            <span class="site__icon">
            <NavIcon :name="it.icon" />
          </span>
            <span class="site__body">
              <span class="site__name">
                {{ it.name }}
                <span v-if="it.featured" class="site__star" title="常用"><svg class="star-icon" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95Z" fill="currentColor"/></svg></span>
              </span>
              <span class="site__desc">{{ it.desc }}</span>
            </span>
            <span class="site__tag">{{ it.tag }}</span>
          </a>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.navsite {
  margin: 8px 0 24px;
}

/* ---------- 搜索 ---------- */
.search {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 14px;
  height: 44px;
  margin-bottom: 26px;
  background: var(--vp-c-bg-soft);
  border: var(--hp-border);
  border-radius: 8px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.search:focus-within {
  border-color: var(--vp-c-brand-2);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.search__icon {
  flex: 0 0 auto;
  color: var(--vp-c-text-3);
}

.search__input {
  flex: 1;
  min-width: 0;
  font: inherit;
  font-size: 14px;
  color: var(--vp-c-text-1);
  background: transparent;
  border: 0;
  outline: none;
}

.search__input::placeholder {
  color: var(--vp-c-text-3);
}

/* 去掉原生 search 的清除按钮，用自定义的 */
.search__input::-webkit-search-cancel-button {
  display: none;
}

.search__clear {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  font-size: 11px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-soft);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: color 0.25s ease;
}

.search__clear:hover {
  color: var(--vp-c-text-1);
}

.search__hint {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.result-bar {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.result-bar strong {
  color: var(--vp-c-text-1);
}

/* ---------- 分组 ---------- */
.navgroup {
  margin-bottom: 34px;
}

.navgroup__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 13px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.navgroup__title {
  margin: 0;
  padding: 0;
  font-size: 16px;
  font-weight: 660;
  letter-spacing: -0.015em;
  color: var(--vp-c-text-1);
  border-top: 0;
}

.navgroup__desc {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

.navgroup__count {
  margin-left: auto;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-3);
}

/* ---------- 站点卡片 ---------- */
.grid {
  display: grid;
  /*
   * 必须用 minmax(0, 1fr)，不能写 1fr。
   * 1fr 的隐含最小值是 auto，卡片里的名称/描述/标签会把列撑宽：
   * 实测三列被撑成 228.5 / 241.8 / 228.5，总宽 721 > 容器 672，
   * 第三张卡右边缘比分组标题横线多出 49px，整排看着"比下面长"。
   */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 11px;
}

.site {
  display: flex;
  align-items: center;
  gap: 12px;
  /* grid 子项默认 min-width: auto，长站点名会把列顶宽 */
  min-width: 0;
  padding: 14px 15px;
  text-decoration: none;
  color: inherit;
  border-radius: var(--hp-radius);
  /* hover 交给全局液态玻璃规则 */
}

.site__icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* 彩色 SVG 需要干净的浅底才显色，深色下换成半透明深底 */
.dark .site__icon {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.site__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.site__name {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 13.5px;
  font-weight: 620;
  letter-spacing: -0.005em;
  color: var(--vp-c-text-1);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site__star {
  display: inline-flex;
  align-items: center;
  color: var(--rb-3);
}

.site__star :deep(.star-icon) {
  display: block;
}

.site__desc {
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--vp-c-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site__tag {
  flex: 0 0 auto;
  padding: 2px 7px;
  font-size: 10.5px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-soft);
  border-radius: 5px;
  white-space: nowrap;
}

.empty {
  padding: 48px 0;
  text-align: center;
  font-size: 13.5px;
  color: var(--vp-c-text-3);
}

/* ---------- 深色适配 ---------- */
.dark .site__desc {
  color: var(--vp-c-text-2);
  opacity: 0.95;
}

.dark .site__tag {
  color: var(--vp-c-text-1);
  background: rgba(255, 255, 255, 0.12);
  opacity: 0.9;
}

.dark .navgroup__desc,
.dark .navgroup__count,
.dark .search__hint {
  color: var(--vp-c-text-2);
}

.dark .navgroup__head {
  border-bottom-color: rgba(255, 255, 255, 0.14);
}

/* 分组标题在深色下再亮一档，和说明文字拉开层级 */
.dark .navgroup__title {
  color: #fff;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .search {
    height: 42px;
    padding: 0 12px;
  }
  .search__hint {
    display: none;
  }
  .navgroup__desc {
    display: none;
  }
  .site {
    padding: 12px 13px;
  }
}
</style>
