---
title: 项目
description: 我做过的开源项目与作品
---

# 项目

这里收录了我做过的开源项目和作品，按类型分组。想看代码可以点标题进仓库。

## 开源作品

### [vitepress-theme-mono](https://github.com/yourname) · `420 stars`

一个克制的 VitePress 博客主题，内置标签与归档、阅读时长估算、代码块高亮优化，开箱即用。

::: tip 适合谁
想用 VitePress 写博客，但不想自己写一堆组件的人。
:::

技术栈：`VitePress` `Vue 3` `TypeScript`

### [tiny-form](https://github.com/yourname) · `1.1k stars`

零依赖的表单校验内核，2KB 起步。支持异步规则、嵌套字段、动态字段增删，可以独立使用，也能接入任意 UI 框架。

```ts
import { createForm } from 'tiny-form'

const form = createForm({
  fields: {
    email: { rules: ['required', 'email'] },
    password: { rules: ['required', { min: 8 }] },
  },
})

await form.validate({ email: 'a@b.com', password: '12345678' })
```

技术栈：`TypeScript` `Monorepo` `Vitest`

### [perf-lens](https://github.com/yourname) · `560 stars`

基于 Performance API 的前端性能看板。在页面里挂一行脚本，就能自动采集 LCP、CLS、INP 等核心指标，并在看板里按版本、按路由聚合。

技术栈：`Nuxt` `ECharts` `Node.js`

## 早期作品

### 个人主页（本站）

用 VitePress 搭建的个人主页，包含首页、项目、博客、关于四个板块。支持暗色模式、全站搜索和 GitHub Pages 自动部署。

技术栈：`VitePress` `Vue 3` `CSS`

## 关于协作

如果你对上面某个项目感兴趣，或者想一起做点什么，欢迎直接发邮件到 [hello@example.com](mailto:hello@example.com)。
