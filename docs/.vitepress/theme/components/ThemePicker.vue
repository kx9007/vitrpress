<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { themes, DEFAULT_THEME } from '../../profile'

const current = ref<string>(DEFAULT_THEME)
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const STORAGE_KEY = 'site-theme-color'

const activeTheme = computed(
  () => themes.find((t) => t.id === current.value) ?? themes[0]
)

function apply(id: string) {
  current.value = id
  document.documentElement.setAttribute('data-theme', id)
  localStorage.setItem(STORAGE_KEY, id)
}

function onDocClick(e: MouseEvent) {
  if (!rootEl.value) return
  if (!rootEl.value.contains(e.target as Node)) open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && themes.some((t) => t.id === saved)) {
    current.value = saved
    document.documentElement.setAttribute('data-theme', saved)
  } else {
    document.documentElement.setAttribute('data-theme', DEFAULT_THEME)
  }
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="rootEl" class="theme-picker">
    <button
      type="button"
      class="theme-picker__trigger"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="`主题配色：${activeTheme.name}`"
      :title="`主题配色：${activeTheme.name}`"
      @click.stop="open = !open"
    >
      <span
        class="theme-picker__swatch"
        :style="{
          background: `conic-gradient(from 140deg, var(--rb-1), var(--rb-3), var(--rb-5), var(--rb-7), var(--rb-1))`,
        }"
      />
      <svg
        class="theme-picker__caret"
        :class="{ 'is-open': open }"
        viewBox="0 0 24 24"
        width="12"
        height="12"
        aria-hidden="true"
      >
        <path
          d="m6 9 6 6 6-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <Transition name="picker">
      <ul v-show="open" class="theme-picker__menu" role="listbox" aria-label="主题配色">
        <li v-for="t in themes" :key="t.id" role="none">
          <button
            type="button"
            role="option"
            :aria-selected="current === t.id"
            class="theme-picker__item"
            :class="{ 'is-active': current === t.id }"
            @click.stop="apply(t.id)"
          >
            <span class="theme-picker__dot" :data-theme-dot="t.id" />
            <span class="theme-picker__name">{{ t.name }}</span>
            <svg
              v-if="current === t.id"
              class="theme-picker__check"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <path
                d="m5 13 4 4L19 7"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.theme-picker {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.theme-picker__trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 9px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft);
  border: var(--hp-border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}

.theme-picker__trigger:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-2);
}

.theme-picker__swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
}

.theme-picker__caret {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  opacity: 0.7;
}

.theme-picker__caret.is-open {
  transform: rotate(180deg);
}

/* ---------- 菜单 ---------- */
.theme-picker__menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 60;
  min-width: 190px;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  box-shadow:
    0 16px 40px -16px rgba(16, 24, 40, 0.28),
    0 2px 8px -2px rgba(16, 24, 40, 0.1);
}

.dark .theme-picker__menu {
  box-shadow:
    0 16px 44px -16px rgba(0, 0, 0, 0.7),
    0 2px 8px -2px rgba(0, 0, 0, 0.4);
}

.theme-picker__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  font: inherit;
  font-size: 13.5px;
  color: var(--vp-c-text-1);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.22s ease;
}

.theme-picker__item:hover {
  background: var(--vp-c-default-soft);
}

.theme-picker__item.is-active {
  background: var(--vp-c-brand-soft);
}

.theme-picker__dot {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

/* 每个主题的小色点：用该主题的 3 个关键色做锥形渐变 */
.theme-picker__dot[data-theme-dot='rainbow'] {
  background: conic-gradient(
    from 0deg,
    #ff375f,
    #ffd60a,
    #30d158,
    #40cbe0,
    #0a84ff,
    #bf5af2,
    #ff375f
  );
}
.theme-picker__dot[data-theme-dot='green'] {
  background: conic-gradient(from 0deg, #79de97, #00ac82, #2d9755, #79de97);
}
.theme-picker__dot[data-theme-dot='purple'] {
  background: conic-gradient(from 0deg, #d7a3ff, #a855f7, #7c3aed, #d7a3ff);
}
.theme-picker__dot[data-theme-dot='blue'] {
  background: conic-gradient(from 0deg, #8fbcff, #3b82f6, #1d4ed8, #8fbcff);
}
.theme-picker__dot[data-theme-dot='amber'] {
  background: conic-gradient(from 0deg, #ffd98f, #e8a33d, #b8791f, #ffd98f);
}
.theme-picker__dot[data-theme-dot='red'] {
  background: conic-gradient(from 0deg, #ff8f7a, #ef4444, #b91c1c, #ff8f7a);
}

.theme-picker__name {
  flex: 1;
  white-space: nowrap;
}

.theme-picker__check {
  flex: 0 0 auto;
  color: var(--vp-c-brand-1);
}

/* ---------- 过渡 ---------- */
.picker-enter-active,
.picker-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

@media (max-width: 768px) {
  .theme-picker__menu {
    right: -8px;
  }
}
</style>
