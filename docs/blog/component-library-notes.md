---
title: 我如何组织一个长期维护的组件库
date: 2026-09-12
description: 分层、命名、版本与文档，四个最容易踩坑的地方。
---

# 我如何组织一个长期维护的组件库

组件库的难点从来不是"把第一个组件写出来"，而是"两年后还有没有人敢改它"。这篇总结我在维护组件库时踩过的坑。

## 一、分层要早做

一开始大家都是 `components/` 平铺，几十个组件之后就乱套了。我现在的分法是三层：

```
packages/
├── tokens/        # 设计变量：颜色、间距、字号
├── primitives/    # 原子组件：Button、Input、Tag
└── components/    # 业务组件：SearchBar、DataTable
```

`tokens` 只导出 CSS 变量和 TS 常量，不依赖任何东西。`primitives` 依赖 tokens。`components` 依赖前两者。**依赖只能单向前进**，这条规则能避免 90% 的循环依赖。

## 二、命名比实现重要

`Button` 的 `type` 属性该叫 `type` 还是 `variant`？这种争论看似无聊，但它决定了三年后的可维护性。

我的约定：

- `variant`：视觉样式，如 `primary` / `secondary` / `ghost`
- `size`：尺寸，如 `sm` / `md` / `lg`
- `status`：状态语义，如 `success` / `warning` / `error`
- `type` 留给原生 HTML 语义，如 `submit` / `button`

不要用 `kind`、`style`、`appearance` 这些同义词，它们只会制造混乱。

## 三、版本号别乱升

组件库的版本号是契约。我的规则：

| 改动 | 版本 |
| --- | --- |
| 改 bug、调样式细节 | patch |
| 加新组件、加可选属性 | minor |
| 删属性、改默认值、改 DOM 结构 | major |

"删属性"必须走 major，哪怕你觉得没人用。总有人用。

## 四、文档和代码放在一起

组件文档最大的问题是过期。我的做法是把示例写在组件目录里：

```
Button/
├── Button.vue
├── Button.test.ts
├── index.ts
└── README.md      # 用法 + 示例
```

然后用脚本扫描所有 `README.md` 生成文档站。改代码的时候顺手改文档，因为它们就在隔壁。

## 一个反例

我见过一个组件库，`Modal` 组件有 27 个 props，其中 6 个是控制显隐的（`visible`、`open`、`show`、`isOpen`、`display`、`v-model`）。原因是三个团队各自加了一个，谁也不敢删。

这就是没有约定的代价。**约定不是限制，是让后来的人少做一次决策。**

## 小结

- 分层要单向依赖，越早定越好
- 命名先定词表，再写组件
- 版本号遵守语义化，破坏性改动必须走 major
- 文档贴着代码放，别单独维护

组件库是给未来的人写的，包括未来的你自己。
