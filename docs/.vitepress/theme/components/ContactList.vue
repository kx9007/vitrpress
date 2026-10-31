<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { contacts } from '../../profile'
import ContactIcon from './ContactIcon.vue'

const copied = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

async function copy(c: { key: string; value: string }) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(c.value)
    } else {
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
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => (copied.value = null), 1800)
  } catch {
    copied.value = null
  }
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <ul class="contact-list">
    <li v-for="c in contacts" :key="c.key" class="contact-list__item">
      <span class="contact-list__icon" :class="`contact-list__icon--${c.key}`">
        <ContactIcon :name="c.key" />
      </span>
      <span class="contact-list__name">{{ c.name }}</span>

      <a
        v-if="c.kind === 'link'"
        class="contact-list__value contact-list__value--link"
        :href="c.href"
        target="_blank"
        rel="noreferrer"
      >
        {{ c.value }}
      </a>

      <button
        v-else
        type="button"
        class="contact-list__value contact-list__value--copy"
        :aria-label="`${c.hint}：${c.value}`"
        @click="copy(c)"
      >
        <span class="contact-list__text">{{ c.value }}</span>
        <span class="contact-list__hint">{{ copied === c.key ? '已复制' : '复制' }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.contact-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 14px 0 18px;
  padding: 0;
  list-style: none;
}

.contact-list__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 12px;
  border-radius: 10px;
  transition: background 0.3s ease;
}

.contact-list__item:hover {
  background: var(--vp-c-default-soft);
}

.contact-list__icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  color: #fff;
  border-radius: 9px;
  background: rgba(120, 130, 160, 0.5);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.contact-list__icon :deep(svg) {
  width: 15px;
  height: 15px;
}

.contact-list__icon--qq {
  background: linear-gradient(145deg, #3ba7ef, #1c7ed6);
}
.contact-list__icon--wechat {
  background: linear-gradient(145deg, #3ecf6d, #1aad4e);
}
.contact-list__icon--email {
  background: linear-gradient(145deg, #7c8ba1, #57616f);
}
.contact-list__icon--github {
  background: linear-gradient(145deg, #3d4149, #17191d);
}
.contact-list__icon--gitee {
  background: linear-gradient(145deg, #f2545b, #c9302c);
}
.contact-list__icon--youtube {
  background: linear-gradient(145deg, #ff4d4d, #d91f1f);
}
.contact-list__icon--x {
  background: linear-gradient(145deg, #2f3338, #08090a);
}
.contact-list__icon--instagram {
  background: linear-gradient(135deg, #f9ce34, #ee2a7b 50%, #6228d7);
}
.contact-list__icon--tiktok {
  background: linear-gradient(145deg, #2b2d31, #0c0d0f);
}

.contact-list__name {
  flex: 0 0 84px;
  font-size: 14px;
  font-weight: 560;
  color: var(--vp-c-text-1);
}

.contact-list__value {
  font-size: 13.5px;
  line-height: 1.5;
}

.contact-list__value--link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s ease;
}

.contact-list__value--link:hover {
  border-bottom-color: currentColor;
}

.contact-list__value--copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  font: inherit;
  color: var(--vp-c-text-2);
  background: none;
  border: 0;
  cursor: pointer;
}

.contact-list__text {
  color: var(--vp-c-text-1);
}

.contact-list__hint {
  font-size: 11.5px;
  color: var(--vp-c-brand-1);
  opacity: 0;
  transition: opacity 0.25s ease;
}

/* 平时只显示账号，悬停时提示"复制" */
.contact-list__item:hover .contact-list__hint {
  opacity: 0.9;
}

@media (max-width: 640px) {
  .contact-list__item {
    gap: 10px;
    padding: 9px 6px;
  }
  .contact-list__name {
    flex-basis: 66px;
    font-size: 13px;
  }
  .contact-list__value {
    font-size: 12.5px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
