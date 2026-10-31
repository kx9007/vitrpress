<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'

type Mode = 'light' | 'dark' | 'auto'

const STORAGE_KEY = 'vitepress-theme-appearance'
const mode = ref<Mode>('auto')
const systemDark = ref(false)
let mql: MediaQueryList | null = null

/** 实际生效的外观：auto 时跟随系统 */
const resolved = computed<'light' | 'dark'>(() =>
  mode.value === 'auto' ? (systemDark.value ? 'dark' : 'light') : mode.value
)

function apply() {
  const el = document.documentElement
  el.classList.toggle('dark', resolved.value === 'dark')
  el.style.colorScheme = resolved.value
}

function setMode(next: Mode) {
  mode.value = next
  // VitePress 原生支持 'auto' 值，统一写入即可，
  // 不要 removeItem——否则它的内置脚本会再写回 'auto'，造成来回反复
  localStorage.setItem(STORAGE_KEY, next)
  apply()
}

function onSystemChange(e: MediaQueryListEvent) {
  systemDark.value = e.matches
  if (mode.value === 'auto') apply()
}

onMounted(() => {
  mql = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = mql.matches

  // 读取已有偏好：localStorage 无值即视为 auto
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') mode.value = saved
  else mode.value = 'auto' // 无记录或 'auto' 均视为跟随系统

  apply()
  mql.addEventListener('change', onSystemChange)
})

onBeforeUnmount(() => {
  mql?.removeEventListener('change', onSystemChange)
})

const options: { value: Mode; label: string; icon: string }[] = [
  {
    value: 'light',
    label: '浅色',
    icon: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.42-1.42M4.92 19.08l1.42-1.42m11.32 0 1.42 1.42M4.92 4.92l1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  },
  {
    value: 'dark',
    label: '深色',
    icon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  },
  {
    value: 'auto',
    label: '跟随系统',
    icon: 'M4 5h16v11H4zM9 20h6M12 16v4',
  },
]
</script>

<template>
  <div class="theme-switch" role="group" aria-label="外观模式">
    <span
      class="theme-switch__thumb"
      :style="{ transform: `translateX(${options.findIndex((o) => o.value === mode) * 100}%)` }"
      aria-hidden="true"
    />
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="theme-switch__btn"
      :class="{ 'is-active': mode === opt.value }"
      :aria-label="opt.label"
      :aria-pressed="mode === opt.value"
      :title="opt.label"
      @click="setMode(opt.value)"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path
          :d="opt.icon"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.theme-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  border: var(--hp-border);
}

.theme-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--vp-c-bg);
  box-shadow:
    0 1px 4px rgba(16, 24, 40, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.theme-switch__btn {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: var(--vp-c-text-3);
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.theme-switch__btn:hover {
  color: var(--vp-c-text-1);
}

.theme-switch__btn.is-active {
  color: var(--vp-c-text-1);
}

@media (max-width: 768px) {
  .theme-switch {
    display: none;
  }
}
</style>
