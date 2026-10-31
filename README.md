# 个人主页（VitePress）

一个干净、轻量的 VitePress 个人主页：首页自定义布局 + 项目页 + 博客 + 关于页，支持暗色模式、全站搜索和 GitHub Pages 自动部署。

## 快速开始

```bash
npm install
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 构建，产物在 docs/.vitepress/dist
npm run preview  # 预览构建结果
```

> 如果 `npm install` 后没有生成 `node_modules`，多半是环境里设了 `NODE_ENV=production`。
> 用 `NODE_ENV=development npm install --include=dev` 重新安装即可。

## 改哪里

| 想改什么 | 改这个文件 |
| --- | --- |
| 姓名、邮箱、所在城市、头像缩写 | `docs/.vitepress/profile.ts` |
| 联系方式（QQ/微信/邮箱/GitHub/Gitee/YouTube/X/Ins/TikTok） | `profile.ts` 的 `contacts` |
| API 站点列表 | `profile.ts` 的 `apiSites` |
| 导航网站点 | `profile.ts` 的 `navGroups` |
| 导航栏社交图标 | `profile.ts` 的 `socialLinks` |
| 首页大标题、副标题、简介、三个按钮 | `docs/index.md` 的 frontmatter |
| 数据条（经验年限、项目数等） | `profile.ts` 的 `stats` |
| 技术栈分组 | `profile.ts` 的 `skills` |
| 首页精选项目卡片 | `profile.ts` 的 `projects` |
| 首页最近文章列表 | `profile.ts` 的 `posts` |
| 导航栏 | `profile.ts` 的 `nav` |
| 博客侧边栏 | `profile.ts` 的 `sidebar` |
| 站点标题、base、仓库地址 | `profile.ts` 的 `site` |
| 配色、圆角、间距 | `docs/.vitepress/theme/custom.css` |
| 外观切换控件（三态） | `theme/components/ThemeSwitch.vue` |
| 主题配色选择器 | `theme/components/ThemePicker.vue` |
| 新增/修改主题色 | `tools/gen-themes.py`（改完重新运行） |
| 首页各区块布局与样式 | `docs/.vitepress/theme/components/HomeSections.vue` |

改姓名时记得两处同步：`profile.ts` 里的 `profile.name`，和 `docs/index.md` frontmatter 的 `hero.name`。

## 目录结构

```
personal-homepage/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts              # 站点配置（读 profile.ts）
│   │   ├── profile.ts              # 全站内容数据源（重点看这个）
│   │   └── theme/
│   │       ├── index.ts            # 主题入口，注册全局组件
│   │       ├── custom.css          # 主题变量与共享样式
│   │       └── components/
│   │           └── HomeSections.vue # 首页 hero 下方的所有区块
│   ├── index.md                    # 首页（home 布局 + 自定义区块）
│   ├── projects.md                 # 项目页
│   ├── about.md                    # 关于页
│   ├── blog/
│   │   ├── index.md                # 博客归档
│   │   └── *.md                    # 文章
│   └── public/                     # 静态资源，原样拷贝到产物根目录
│       ├── favicon.svg
│       └── avatar.svg
├── .github/workflows/deploy.yml    # GitHub Pages 自动部署
└── package.json
```

## 联系方式

首页「联系我」和关于页的联系列表**共用同一份数据** —— `profile.ts` 的 `contacts`。改一处，两处同步，不会出现两边不一致。

```ts
{
  key: 'qq',                 // 决定图标（见 ContactIcon.vue 的 paths）
  name: 'QQ',
  kind: 'copy',              // 'copy' 点击复制；'link' 新窗口打开
  value: '100000000',
  hint: '点击复制 QQ 号',
}
```

两点说明：

- **QQ、微信、邮箱为什么用 `copy`**：这三个没有稳定的个人主页 URL。QQ 是号码，微信是 ID，邮箱虽然能 `mailto:`，但很多人的默认邮件客户端没配置好，点了没反应。所以做成点击复制，更可靠。
- **导航栏只放 4 个**：VitePress 的 `socialLinks` 只认内置图标集（github / x / instagram / youtube / linkedin / discord 等）。QQ、微信、Gitee、TikTok 没有内置图标，所以只在首页和关于页显示。想给导航栏加 Gitee 的话，需要自己写一个导航组件替换默认的社交图标组。

加新平台：在 `contacts` 里加一项，再去 `ContactIcon.vue` 的 `paths` 里加对应 `key` 的 SVG 路径即可。

## API 站点页

`/api` 页面用卡片墙展示多个 API 站点，包含分类筛选、运行状态、模型标签和一键复制 Base URL。

数据在 `profile.ts` 的 `apiSites` 里：

```ts
{
  name: '站点甲 · 综合中转',
  url: 'https://api-a.example.com',        // 「访问站点」跳转地址
  baseUrl: 'https://api-a.example.com/v1', // 做成一键复制的就是这个
  desc: '多模型统一入口，OpenAI 兼容协议。',
  category: '综合中转',                     // 分类筛选从这里自动派生
  models: ['GPT-4o', 'Claude 3.5 Sonnet'],
  status: 'online',                        // online / unstable / maintenance / offline
  pricing: '按量计费',
  docs: 'https://api-a.example.com/docs',  // 可省略
  featured: true,                          // 可省略，会显示星标
}
```

几点说明：

- **分类不用另外维护**：筛选项由 `category` 的取值自动去重生成，加新分类只要在数据里写上就行
- **状态是手动标注的**，不是实时探测。如果想要真实在线检测，需要加一个后端接口或构建时请求，涉及跨域和密钥，比静态站复杂得多
- **只有 Base URL 做了复制**，因为这是用 API 时最常被粘贴的东西；站点地址和文档是普通外链

## 导航网

`/nav` 页面按用途分组展示我的相关站点，带实时搜索。

数据在 `profile.ts` 的 `navGroups`：

```ts
{
  title: '我的站点',
  desc: '自己维护的产品与工具',   // 分组说明，窄屏自动隐藏
  items: [
    {
      name: '主站',
      url: 'https://example.com',
      desc: '个人主页与博客入口',
      icon: 'home',      // NavIcon 的 key，见下方说明
      tag: '自有',        // 卡片右侧小标签
      featured: true,    // 可选，显示星标
      internal: true,    // 可选，站内链接：不新开标签页
    },
  ],
}
```

**图标**：`icon` 字段是 `NavIcon.vue` 里的 key，全部为 SVG 双色渐变图标，全站不使用 emoji。可选值：

`home`（橙）`api`（蓝紫）`tools`（灰）`code`（紫）`fork`（红）`box`（金）
`pen`（青）`play`（红）`music`（青）`camera`（品红）`palette`（玫红）
`triangle`（蓝）`globe`（绿）

写错 key 会回退到默认书签图标，不会报错。加新图标就在 `NavIcon.vue` 的 `shapes` 和 `palettes` 里各加一条。

**链接行为**：`internal: true` 的站内链接（如 `/api`、`/blog/`）在当前页打开；外部链接自动加 `target="_blank"` 和 `rel="noreferrer noopener"`。

**搜索**匹配四个字段：站点名、描述、标签、所在分组名。所以搜「视频」能筛出所有带该标签的站点，搜「常用工具」能筛出整组。

## 首屏动态背景与页面动效

### 全屏首屏

首屏（`HeroCinema.vue`）占满 `100svh`，背景有两种：

1. **默认：Canvas 动态光影** —— 5 团流体光晕 + 三层景深星尘 + 3 条缓慢漂移的光带，纯 Canvas 绘制，零资源、零请求
2. **可选：真实视频** —— 把 mp4 放进 `docs/public/`，然后改 `profile.ts`：

```ts
heroVideo: '/your-video.mp4',
```

留空则用 Canvas，**不会产生任何 404 请求**（早期版本用 fetch 探测，会在控制台留报错，已改掉）。

导航栏在首屏未滚动时完全透明、文字转白；滚动超过 40px 后自动恢复玻璃底和深色文字，保证在浅色内容区也能读。

### 三层动效

| 动效 | 实现 | 触发 |
| --- | --- | --- |
| 首屏进场 | CSS keyframes 依次上浮 | 页面加载 |
| 路由切换 | 斜切彩虹光带扫过 | 路由变化 |
| 滚动浮现 | IntersectionObserver | 元素进入视口 |

**注意**：路由监听不能写在 Layout 内的组件里。VitePress 每次路由变化都会重建 Layout，组件内的监听器随之丢失（这是实测踩到的坑）。所以监听放在 `theme/index.ts` 的 `enhanceApp` 里，并且用 URL 轮询而不是 `onAfterRouteChanged`——后者在某些场景下不会触发。

`ScrollReveal` 通过 `scan-reveal` 自定义事件接收重新扫描指令，这样即使组件重新挂载也能接管新内容。

全部动效都尊重 `prefers-reduced-motion`。

## 彩虹花冠：绕中心圆的圆弧

`RainbowFan.vue` 的 **12 片**花瓣都是正圆弧，它们**不挤在同一个点上**——每片的起点落在中心圆的边缘，向外弧出去。

```
M 圆环上一点 → A R R 0 0 1 尖端
```

### 为什么要留中心圆

七条弧如果都精确共点，中心附近会糊成一团毛刺：看不清起点，整朵花也没有视觉重心。中间放一个实心圆盘当"轴"，弧从环边出发，结构立刻清楚，看起来才协调。

中心圆由四层组成：

| 层 | 作用 |
| --- | --- |
| `HUB_R + 10` | 外圈柔光，`radialGradient` 渐隐 |
| `HUB_R` 实心盘 | **彩虹径向渐变** `url(#hub-rainbow)` |
| `HUB_R` 描边环 | 淡白细线，压在彩色底上界定边界 |
| `r = 3.5` | 中心高光点 |

中心盘原本是 `rgba(16,18,28,0.55)` 的深色，在页面上像一块黑斑。改成
`#hub-rainbow` 径向渐变后——中心偏白黄、向外经橙红、青、蓝过渡到紫——
和外围 12 条彩弧同一色系，花心自然成了整朵花最亮的地方。

半径 `HUB_R` 同时是每片弧的起点半径，两处必须一致，否则弧会脱离圆环。

### 尺寸受画布限制

`viewBox` 是 `400×400`，圆心到边界只有 200。花瓣尖端半径 `= HUB_R + LENGTH` 必须小于 200，否则会被裁掉。

| 参数 | 值 |
| --- | --- |
| HUB_R | 32 |
| LENGTH（弦长） | 150 |
| BOW（鼓出） | 30.5 |
| R（弧半径） | 107.5 |
| 尖端半径 | 182 |
| 弧长 | 166.6 |

半径由弦长和鼓高反解：

```
R = (LENGTH² / 4 + BOW²) / (2 · BOW)
  = (5625 + 930) / 61
  ≈ 107.5
```

### 花瓣数量与鼓出量的约束

数量从 7 加到 12 时，`BOW` 必须同步收窄，否则相邻弧会重叠。判据是「中段张角 < 每片夹角」：

| 数量 | 每片夹角 | 可用的 BOW | 中段张角 | 余量 |
| --- | --- | --- | --- | --- |
| 7 | 51.43° | 52 | 42.2° | +9.2° |
| 10 | 36.00° | 37 | 30.7° | +5.3° |
| 12 | 30.00° | 30.5 | 25.5° | +4.5° |
| 14 | 25.71° | 26 | 21.9° | +3.9° |

直接用 7 条时的 BOW=52 套到 12 条上，余量会变成 **-12.2°**，弧线明显互相穿插。

`A` 命令的两个半径都写 `R`（相等），所以是正圆弧。

实测包围盒 `18.7, 19.8 → 384.7, 379.8`，完整落在画布内。

### 中心：棒棒糖糖面

中心圆盘不是单色，也不是简单的径向渐变，而是**36 条螺旋色带**拼成的糖面，自身以花瓣转速的 1.6 倍缓慢自转。

**为什么不用 `conic-gradient`：** SVG 没有原生锥形渐变。虽然 CSS 的 `conic-gradient` 能做到，但这里是画在 `<svg>` 里的，只能用 `<path>` 自绘扇形。

#### 螺旋是怎么来的

每条色带的两侧不是笔直的半径，而是**从圆心到圆周逐渐拧过去**：

```ts
const SWIRL = 42        // 外缘相对内缘扭转 42°
const STEPS = 20        // 每条侧边用 20 段折线逼近

for (let k = 0; k <= STEPS; k++) {
  const t = k / STEPS           // 0 = 圆心, 1 = 边缘
  const r = HUB_R * t
  const deg = baseDeg + SWIRL * t   // 角度随半径递增 → 螺旋
}
```

`SWIRL = 0` 就是普通放射扇形（像切开的披萨），`42°` 才有棒棒糖那种向内卷的螺纹。超过 90° 会卷成一团。

#### 三个影响观感的参数

| 参数 | 值 | 作用 |
| --- | --- | --- |
| COUNT | 36 | 色带数量。24 条时边缘锯齿明显，36 条接近平滑 |
| STEPS | 20 | 每条侧边的折线段数。12 段能看到折角 |
| SWIRL | 42° | 扭转量，决定"卷"的程度 |

#### 立体感从哪来

只画彩色扇形会像"切开的披萨"。上面再压一层 `#hub-shade` 径向渐变——中心提亮、边缘压暗（`rgba(0,0,0,0.3)`）——平涂就变成了球面。

色带之间还加了极淡的同色描边（`stroke-width: 0.5`、`stroke-opacity: 0.6`），填掉拼接缝隙。

#### 为什么相邻色带透明度是 1 和 0.88

交替明暗能做出糖丝的层次。但差值不能大——最初用 `1 vs 0.78`，视觉上成了明显的色块拼接，和外围柔和发光的弧线放在一起很不协调。收窄到 `1 vs 0.88` 后过渡自然得多。

### 入场：从四面八方飞入

12 片花瓣不是原地淡入，而是**从各自方位的外侧飞进来**聚拢成花冠。

模板是三层结构：

```html
<g class="fan__fly" :class="{ 'is-in': ready }">   <!-- 位移：从远处飞来 -->
  <g :transform="`rotate(${p.angle} 200 200)`">    <!-- 方位：i × 30° -->
    <path class="fan__petal" />                    <!-- 本体 -->
```

**位移必须在旋转之前作用（外层）。** 如果反过来，每片的飞行方向会跟着自己的方位一起转，12 片就全朝同一个方向飞了。

飞行起点按方位角计算：

```ts
const FLY_DIST = 300   // > 画布半径 200，保证起点在可视区外
flyX = Math.cos(rad) * FLY_DIST
flyY = Math.sin(rad) * FLY_DIST
```

实测 12 片的起点覆盖了所有方向：

| 序号 | flyX | flyY | 方向 |
| --- | --- | --- | --- |
| 0 | 0 | −300 | 正上 |
| 3 | 300 | 0 | 正右 |
| 6 | 0 | 300 | 正下 |
| 9 | −300 | 0 | 正左 |

其余 8 片落在对角方向，间隔精确 30°。入场延迟 `i × 55ms`，形成一圈扫过的节奏。

#### 关键：双 rAF 触发

```ts
requestAnimationFrame(() => {
  requestAnimationFrame(() => { ready.value = true })
})
```

**只等一帧不够。** 挂载后第一帧就置 `ready = true`，DOM 从"远处"直接变"就位"，浏览器来不及把初始态画上屏，`transform` 过渡等于被跳过——现象就是"页面一加载就已经在那了"，看不出动画。

双 rAF 确保初始态已经渲染过一帧，过渡才有起点可播。

#### 验证方式

重置到起点后逐帧采样，确认是平滑插值而非瞬间到位：

| 时间 | Y 位移 | 缩放 | 不透明度 |
| --- | --- | --- | --- |
| 16ms | −300 | 0.33 | 0 |
| 42ms | −253 | 0.44 | 0.05 |
| 75ms | −204 | 0.55 | 0.18 |
| 120ms | −151 | 0.66 | 0.41 |

### 旋转：必须用 JS 而不是 CSS animation

花冠自转，悬停时加速（30s 一圈 → 7s 一圈）。

**不要用 `animation-duration` 切换速度。** 早期实现是：

```css
.is-assembled .fan__svg { animation: fan-spin 30s linear infinite; }
.is-hover     .fan__svg { animation-duration: 7s; }
```

这有两个问题：

1. **角度会跳。** 改 `duration` 时浏览器按"进度百分比"重新映射，比如已经转到 180°（30s 周期的 50%），切成 7s 后仍是 50%，实际角度还停在 180° 但速度突变了；若在别的进度点上会看到明显的位置跳跃。
2. **拿不到当前角度。** CSS 动画没有可读的"转了多少度"，离开再回来无法从原处继续。

现在改成 JS 逐帧累加，**角度是唯一真相，速度只是增量系数**：

```ts
const angle = ref(0)
const SPEED_NORMAL = 360 / 30000  // 0.012 °/ms
const SPEED_HOVER  = 360 / 7000   // 0.0514 °/ms

function tick(ts) {
  const dt = ts - lastTs
  const speed = hovering.value ? SPEED_HOVER : SPEED_NORMAL
  angle.value = (angle.value + speed * dt) % 360
}
```

角度绑到 `<g class="fan__petals" :style="{ transform: 'rotate(...)' }">` 上。切换速度只改变增量，已有角度不受影响。

**实测验证**（每 100ms 采样角度增量）：

| 阶段 | 每 100ms 增量 |
| --- | --- |
| 静止 | 1.20° |
| 触摸 | 5.14°（约 4.3 倍） |
| 离开 | 1.20° |

切换点增量从 1.20 平滑变成 5.15，没有跳变。离开 700ms 期间角度继续累加 8.47°，再次进入 600ms 累加 31.14°——全程连续。

前提是 `transform-box: view-box` + `transform-origin: 200px 200px`。**不能用 `fill-box`**，那样会以元素自身包围盒为基准，旋转中心会偏。

### 尖端方向偏一点

尖端相对正上方偏 `SKEW = 8°`，弧不是正对着放射，而是斜着甩出去，形成统一旋向——这是"风扇感"的来源。

### 描边入场动画

弧长 195.3，CSS 写 `stroke-dasharray: 200`。**dasharray 必须 ≥ 弧长**，否则入场动画一开始就有尾巴露出来。改 `LENGTH` 或 `BOW` 都要重算，浏览器里 `path.getTotalLength()` 可直接读实测值。

## 滚动进出场动效

`ScrollReveal.vue`：往下滑时，同一组内的元素交替从**左右两侧**插入；往上滑离开视口时沿原方向退出，再滑回来会重新进场。

### 方向怎么分配

按元素在组内的序号奇偶交替：第 1 个从左、第 2 个从右，以此类推。

整块 section 和正文段落只做**小幅侧移**（22px + 18px 上移），组内卡片走完整幅度（56px + 0.97 缩放）。大段文字横向飞太远会让人眼晕。

| 幅度 | 位移 | 适用 |
| --- | --- | --- |
| full | ±56px，scale 0.97 | 卡片、联系方式、站点 |
| soft | ±22px，+18px 下移 | section 整块、正文段落 |

进场用 `cubic-bezier(0.16, 1, 0.3, 1)`（快进慢收，落位有刹车感），退出用 `cubic-bezier(0.4, 0, 1, 1)`（加速离场，不拖沓），并且退出比进场快。

### 结构：容器 + 独立元素

```js
const CONTAINERS = [
  { sel: '.home-section', child: ':scope > *' },
  { sel: '.posts',       child: ':scope > .post' },
  { sel: '.contacts',    child: ':scope > .contact' },
  // ...
]
const SINGLES = ['.site', '.api']
```

容器负责给子元素编号（决定左右和延迟），自己也会被观察，离开视口时把子元素一起退出。

### 踩过的四个坑

**1. 元素被 prepare 两次，左右交替全废。** `.post` 既是 `.home-section` 的子元素，又在 `SINGLES` 里出现。第二次 prepare 把 `--reveal-i` 重置成 0，结果 9 个联系方式全从左边来。修法：容器处理完把子元素记进 `WeakSet`，后面跳过。

**2. 二级容器被跳过。** `.posts` 自己先被 `.home-section` 接管进了 `seen`，轮到它当容器时直接被 `return`，里面的 `.post` 永远拿不到序号。修法：容器的 `seen` 检查只跳过自己，不跳过子元素处理。

**3. 动画完全不生效。** 这是最花时间的一个。`HomeSections.vue` 里 `.contact` 有自己的 `transition`（只针对 background/border-color），而它是 **scoped** 样式，编译后变成 `.contact[data-v-xxx]`，特异性 (0,2,0)。我写的 `html body .rv` 只有 (0,1,2)，一直输。

用 `!important` 才压住。判断依据是 `getComputedStyle(el).transitionProperty` 始终返回 `background-color, border-color`，而不是 `opacity, transform`。

**4. 首屏保护。** Hero 区域自己有进场动画，不要再叠侧滑，否则两套动效打架。

### 验证方式

用 `requestAnimationFrame` 连续采样 `opacity` 和 `transform`，确认是逐帧平滑过渡而不是瞬间跳变：

```
o: 0.00 → 0.06 → 0.13 → 0.19 → 0.25 → 0.30 → 0.36 → 0.40 → 0.45 → 0.49
tx:  56 → 53.1 → 50.2 → 47.3 → 44.8 → 42.2 → 39.6 → 37.2 → 35.0 → 32.8
```

## 看板娘：Live2D

左下角的看板娘用的是 [stevenjoezhang/live2d-widget](https://github.com/stevenjoezhang/live2d-widget)（GPL-3.0），
装在 `Live2DMascot.vue` 里，挂在 `layout-bottom` 插槽。

### 为什么不用官方 autoload.js

官方 autoload 会在脚本加载完立即 `initWidget` 并写死一整套配置，在 SPA 里有两个问题：

1. 有副作用，没法按需传配置（模型、按钮、文案都要改源文件）
2. 组件重新挂载时会重复注入脚本和样式

所以组件里自己实现了加载流程：动态插入 css / js → 等 `window.initWidget` 就绪 → 调用它。
并用一个全局标记位保证只初始化一次。资源加载失败只 `console.warn`，不影响页面本身。

### 资源来源

| 项 | 地址 |
| --- | --- |
| widget 本体 | `jsdelivr` 上的 `live2d-widgets@1.0.1` |
| 模型库 | `fghrsh/live2d_api`（该仓库自身**不含模型**） |
| Cubism 2 内核 | 随 widget 一起下发 |
| Cubism 5 内核 | Live2D 官方 CDN |

### 几个踩过的坑

**位置被官方样式下压。** 官方 `#waifu` 带 `transform: translateY(25px)`，配合 `bottom: 0`
会把 300px 的盒子整体下移 25px，导致身体下半截被视口底边切掉。需要抵消掉这个位移。

**同优先级规则互相覆盖。** 我一开始写了两条 `html body #waifu`，后一条的 `translateY(0)`
把前一条的 `scale()` 覆盖了。同优先级下后出现的胜出，所以必须合并成一条。

**`scale()` 里带 `vw` 的 `calc()` 会被丢掉。** 写成
`--scale: clamp(0.34, calc((100vw - 1176px)/600), 1)` 时整条 `transform` 静默失效，
角色按 300px 原尺寸溢出并压住正文。改用 `@media` 分段给固定值才可靠。

### 尺寸策略

首屏内容区 `max-width: 1152px` 居中，两侧留白 = `(100vw - 1152px) / 2`。
角色必须待在这段留白里，否则会压住正文和按钮。窗口较窄时留白不够，
就用 `transform: scale()` 把 300px 画布等比缩小（`transform` 不影响布局盒）。

| 视口宽度 | 行为 |
| --- | --- |
| < 768px | 完全隐藏（小屏会挡正文且吃性能） |
| 768 – 1550px | 缩放到 0.36，贴合左侧留白 |
| 1550 – 1650px | 0.58 |
| 1650 – 1720px | 0.76 |
| ≥ 1720px | 画布直接放大到 340px |

### 自定义文案

`waifu-tips.json` 默认那套文案是给 Hexo NexT 主题写的，选择器对本站无效，
而且内容未必适合所有场合。组件里用一份自定义的 `TIPS` 对象，
通过 `Blob` 转成 URL 传给 `waifuPath`（widget 会 `fetch` 这个地址，不能直接传对象）。

鼠标悬停工具按钮、点击首屏按钮、节日、时段问候都在这里改。

## 技术栈：环绕球体

`TechOrbit.vue` 把原来的文字标签墙换成了一个 3D 环绕效果：技术图标沿球面自转，绕到背面的会被球体挡在身后。

图标取自 simpleicons（品牌方官方图形）与 devicon（技术栈专库），
全部已下载到 `docs/public/img/tech/`，共 34 个，不依赖外部 CDN。

**关于阿里 Iconfont**：iconfont 的检索接口返回 `LOGIN REQUIRED`，
没有公开可编程访问的 API，无法直接批量取用。需要的话可以从
iconfont 网页手动挑好转成 SVG 放进这个目录，把 `profile.ts` 里的
`slug` 对应改掉即可。

### 为什么用 CSS 3D 而不是 canvas

- 每个图标都是独立 DOM，可以直接挂 hover 提示
- 矢量图标在任何分辨率下都清晰
- 不需要额外依赖，也不用管 canvas 的 DPR
- 球体与图标的遮挡关系交给 `z-index`，浏览器帮你算

### 布点：避开两极

用斐波那契球把 14 个点均匀铺在球面上。但 `y` 直接从 `1` 线性降到 `-1` 会有个坑：首尾两个点 `y = ±1`，此时水平半径 `r = 0`，`x` 和 `z` 全是 0——这两个图标会**永久钉在圆心**，绕 Y 轴旋转时完全不动，正好挡在球体中间。

所以 `y` 的取值范围收窄到 `±0.86`，两端各留余量，所有点都落在真正的球面上。

### 投影与遮挡

每帧只做绕 Y 轴旋转：

```
x' = x·cosθ + z·sinθ
z' = -x·sinθ + z·cosθ
```

`z'` 决定深度，进而决定缩放、透明度和层级：

| 量 | 范围 |
| --- | --- |
| 缩放 | 0.80 ~ 1.14 |
| 透明度（正面） | 0.55 ~ 1.0 |
| 透明度（背面） | 0.06 ~ 0.30，几乎隐去 |
| z-index（背面） | 0 ~ 40，低于球体的 50，被球体挡住 |
| z-index（正面） | 60 ~ 140，压在球体上方 |

### 34 个点的重叠问题

34 个点在球面上，投影到二维后**前面和后面的点必然重合**——这是 3D 投影的
固有属性，换布点算法解决不了。试过"分层布点"，重叠反而从 9 对增到 26 对。

真正的解法是把背面压到几乎看不见：背面透明度 0.06~0.30，正面 0.55~1.0。
这样同一时刻视觉上只剩正面那 16 个左右是清晰的，重叠自然看不出来。

### 踩过的三个坑

**1. 坐标单位混用。** `left/top` 用百分比输出，但半径先按像素算，结果 `top: 116%` 直接飞出容器。统一改成百分比基准（`RADIUS_PCT`）。

**2. 想靠压缩半径避开球体，反而毁了轨道感。** 一度给投影加了下限，把靠近圆心的点推到外圈——结果图标全挤成一圈，像贴在背景上的分组卡片，完全没有环绕感。正确做法是保留真实投影，用 `z-index` 让球体盖住转到后面的图标。

**3. 球体与图标的尺寸关系。** 球体用 `width: 38%`（直径），图标用 `left: 50 ± 46%`（偏离中心），两者基准不同。球体放大到 52% 时半径 109px，而靠近两极的图标投影只有 60px，必然压上去。

### 布局

桌面端左右分栏：左边球体（420px）、右边分组说明。移动端（≤ 960px）改为上下堆叠，球体缩到 330px。

## API 站点：接口文档

`ApiShowcase.vue` 的每张站点卡片都带一份可展开的接口文档：请求方法、路径、参数表（名称 / 类型 / 必填 / 说明）、返回示例。

数据在 `profile.ts` 的 `apiSites[].endpoints`：

```ts
{
  method: 'POST',
  path: '/chat/completions',
  desc: '创建一次对话补全，支持流式输出。',
  params: [
    { name: 'model', type: 'string', required: true, desc: '模型 ID' },
    { name: 'stream', type: 'boolean', required: false, desc: '是否流式返回' },
  ],
  response: `{ "id": "chatcmpl-9x2f", ... }`,
}
```

`required: true` 的项在界面上标红。

### 三个布局坑（都可以量化验证）

**1. 整页被撑出横向滚动条。** 手机 390px 下 `body.scrollWidth` 变成 579px。根因是 `.cards` 用了 `1fr`——它的隐含最小值是 `auto`，会被参数表和 `pre` 代码块撑开。改成 `minmax(0, 1fr)` 后归零。

**2. 手机上四列表格必须横向拖动才能看全。** 虽然 `overflow-x: auto` 保证了页面不溢出（实测 `bodyScrollWidth = 390`），但体验很差。现在 ≤640px 转成"每个参数一块"的堆叠布局，靠 `td::before { content: attr(data-label) }` 补出列名。

**3. 桌面两列下"说明"列被压扁。** 单卡只有 337px，四列平分后说明列只剩十几个字宽。两处修正：
   - 展开文档时卡片 `grid-column: 1 / -1` 横跨两列（337px → 688px）
   - 表格改 `table-layout: fixed` 并按 26/20/14/40 分配列宽

### 一个响应式陷阱

`openDocs` 一开始用 `ref(new Set())`，模板里 `:class="{ 'api--expanded': openDocs.has(s.name) }"` —— **类名始终不加**。Vue 3 对 Set 的 `has()` 在模板表达式里不会建立可靠的依赖追踪。改成普通对象 `ref<Record<string, boolean>>` 并整体替换引用才生效。

## 联系方式的响应式处理

联系方式在 `HomeSections.vue` 里，位于页面底部的页脚区域（不再是页面中间一张独立卡片）。

**桌面端**：3 列卡片，每张显示「品牌色图标 + 平台名 + 账号」，QQ / 微信 / 邮箱点击复制。

**移动端（≤ 640px）**：收成**纯图标、每行 3 个**，共 3 行，隐藏所有文字。

### 为什么移动端要去掉文字

最初移动端是 `grid-template-columns: 1fr`，也就是一行一个——9 个平台要占 9 行，
一滑下去就是一整屏的联系方式列表，非常突兀。

这些平台的图标本身识别度足够，去掉文字后 3×3 就排完了，
整块高度从近 600px 降到 380px 左右。

### 关键样式

```css
@media (max-width: 640px) {
  .contacts { grid-template-columns: repeat(3, 1fr); }

  /* 去掉卡片壳，只留图标 */
  .contact {
    justify-content: center;
    padding: 0;
    background: none;
    border: 0;
  }

  .contact__icon { width: 46px; height: 46px; }

  /* 文字全部隐藏 */
  .contact__body,
  .contact__action,
  .contact__arrow { display: none; }
}
```

平板（≤ 960px）走两列，仍保留文字。

### 结构上的一处调整

联系区原本是 `.home-section.cta.lg-glass`——一张带边框的卡片，单独占一个区块。
现在改成 `<footer class="home-footer-wrap">`，去掉卡片壳，
用顶部一条渐隐分隔线和版权行连成一体，页面收尾更干净。

## 部署到 GitHub Pages

1. 把项目推到 GitHub 仓库
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**
3. push 到 `main` 分支，workflow 会自动构建并发布

**关于 `base`**：

- 仓库名是 `<username>.github.io` → `site.base` 保持 `'/'`
- 其他仓库名（访问路径带子目录）→ 改成 `'/<仓库名>/'`

否则静态资源全部 404。

## 也可以部署到别处

构建产物是纯静态文件（`docs/.vitepress/dist`），可以直接传到：

- **Vercel / Netlify**：构建命令 `npm run build`，输出目录 `docs/.vitepress/dist`
- **对象存储 / 自己的服务器**：把 dist 目录内容整个上传即可

### EdgeOne Pages

同一份代码发两个平台时，唯一需要区别对待的是 **base 路径** 和 **cleanUrls**：

| 平台 | 访问地址 | base | cleanUrls |
| --- | --- | --- | --- |
| GitHub Pages（项目页） | `https://<user>.github.io/vitrpress/` | `/vitrpress/` | 开（链接无 `.html`） |
| EdgeOne Pages | `https://xxx.edgeone.app/` | `/` | 关（链接带 `.html`） |

原因是 EdgeOne 分配的是**根域名**，若沿用 `/vitrpress/` 前缀，资源会全部 404；
而它也不保证支持"无后缀访问"，`/about` 会 404，必须落到 `/about.html`。

因此构建分两条入口，源码只有一份：

```bash
npm run build          # GitHub Pages（默认，DEPLOY_TARGET=github）
npm run build:edgeone  # EdgeOne Pages（DEPLOY_TARGET=edgeone）
```

EdgeOne 控制台的构建配置（或直接用仓库里的 `edgeone.json` 自动读取）：

- 构建命令：`npm run build:edgeone`
- 输出目录：`docs/.vitepress/dist`
- Node 版本：20.18.0

> 组件里的站内链接统一走 `docs/.vitepress/theme/url.ts` 的 `pageUrl()`，
> 它会按当前构建目标自动决定要不要补 `.html`。不要在组件里硬编码 `href="/xxx"`。

