---
title: 把 VitePress 变成个人主页：从零到上线
date: 2026-10-20
description: 从目录结构、主题定制到 GitHub Pages 自动部署的完整流程。
---

# 把 VitePress 变成个人主页：从零到上线

VitePress 本来是为文档设计的，但它的默认首页布局、Markdown 增强和极快的构建速度，让它也很适合做个人主页。这篇文章记录我这一版主页的搭建过程。

## 为什么选 VitePress

对比过几个方案：

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| VitePress | 构建快、Markdown 友好、主题可深度定制 | 需要写一点 Vue |
| Hexo | 插件生态成熟 | 构建慢，主题定制麻烦 |
| Next.js | 灵活 | 配置重，写文章还得处理一堆构建细节 |

我的需求很明确：写 Markdown、偶尔插入自定义组件、部署要简单。VitePress 正好卡在这个点上。

## 初始化项目

```bash
mkdir personal-homepage && cd personal-homepage
npm init -y
npm i -D vitepress vue
```

然后在 `package.json` 里加上脚本：

```json
{
  "scripts": {
    "dev": "vitepress dev docs",
    "build": "vitepress build docs",
    "preview": "vitepress preview docs"
  }
}
```

## 目录结构

推荐的目录结构是这样：

```
personal-homepage/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts          # 站点配置
│   │   └── theme/
│   │       ├── index.ts        # 主题入口
│   │       ├── custom.css      # 自定义样式
│   │       └── components/     # 自定义组件
│   ├── index.md                # 首页
│   ├── projects.md
│   ├── about.md
│   ├── blog/                   # 博客
│   └── public/                 # 静态资源
└── package.json
```

关键点：**所有会被访问的内容都放在 `docs/` 下**，`docs/.vitepress` 只放配置和主题代码，`docs/public` 里的文件会被原样拷贝到产物根目录。

## 首页用自定义布局

VitePress 默认的 `home` 布局是居中大标题加两个按钮，用来做主页有点单薄。我的做法是：

1. 在 `index.md` 的 frontmatter 里写 `layout: false`，关掉默认布局
2. 引入一个自己写的 `HomePage.vue` 组件

```md
---
layout: false
---

<HomePage />
```

这样整个首页完全由组件控制，想怎么排就怎么排，同时还能享受 VitePress 的导航栏、暗色模式和路由。

## 注册全局组件

在 `docs/.vitepress/theme/index.ts` 里注册：

```ts
import DefaultTheme from 'vitepress/theme'
import HomePage from './components/HomePage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
  },
}
```

注意 `extends: DefaultTheme` 这行不能少，否则会丢掉默认主题的所有能力（导航、侧边栏、搜索框都要自己写）。

## 定制配色

VitePress 的样式变量都以 `--vp-` 开头，覆盖它们就能换主题色：

```css
:root {
  --vp-c-brand-1: #6366f1;
  --vp-c-brand-2: #818cf8;
  --vp-c-brand-3: #4f46e5;
}
```

暗色模式的变量放在 `.dark` 选择器里覆盖，两套色值要分别调，否则暗色下对比度会不够。

## 部署到 GitHub Pages

在仓库里加一个 workflow：

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

Push 到 `main` 之后，去仓库的 Settings → Pages，把 Source 选成 GitHub Actions，第一次跑完就能访问了。

## 几件我后来才注意的事

**`base` 配置**。如果部署到 `https://yourname.github.io/repo-name/` 这样的子路径，必须设置 `base: '/repo-name/'`，否则所有静态资源都会 404。用 `yourname.github.io` 这个仓库名的话不用设。

**`cleanUrls`**。开启后 URL 会去掉 `.html` 后缀，看起来干净很多，但本地预览时要注意路径对应关系。

**搜索**。VitePress 内置的 local search 够用，不需要额外接 Algolia。数据量大的时候构建会慢一点，但个人站点完全不是问题。

---

整套下来，一个可用的个人主页大概两三个小时能做完，剩下时间基本都花在调样式和写内容上。前者值得花，后者更值得。
