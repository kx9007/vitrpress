/**
 * 站点与个人信息 —— 全站唯一数据源
 *
 * 想改名字、简介、联系方式、项目列表、文章列表，基本都只需要改这个文件。
 * （首页 Hero 的大标题在 docs/index.md 的 frontmatter 里，改的时候记得同步一下。）
 */

export const profile = {
  /** 显示名 */
  name: '酷侠',
  /** 头像上的字母/缩写（无头像图时作为兜底显示） */
  initials: 'Kx',
  /**
   * 头像图片
   *
   * 已下载到本地 public/img/avatar.jpg，避免依赖外部站点
   * （qlogo 有防盗链和限流，直接外链可能偶发加载失败）。
   *
   * 想换成远程地址也可以，但要确保是 https ——
   * http 的图片在 https 站点会被浏览器按混合内容拦截：
   *   avatar: 'https://q2.qlogo.cn/headimg_dl?dst_uin=1661993235&spec=640'
   */
  avatar: 'https://q2.qlogo.cn/headimg_dl?dst_uin=1661993235&spec=640',
  /** 一句话身份 */
  title: '全栈开发 / 独立开发者',
  /** 所在地 */
  location: '中国 · 杭州',
  /** 当前在做什么 */
  status: '正在做：一个奇妙的软件',
  /** 邮箱 */
  email: 'kuxia9007@gmail.com',
  /**
   * 首屏背景视频（可选）
   * 把 mp4 放到 docs/public/ 下，然后填 '/你的文件名.mp4' 即可启用。
   * 留空则使用内置的 Canvas 动态光影背景（无任何额外请求）。
   */
  heroVideo: '',
}

export const site = {
  title: profile.name,
  description: `${profile.name}的个人主页 —— ${profile.title}`,
  /**
   * 部署路径。
   * 仓库名是 vitrpress，GitHub Pages 项目页地址为
   * https://kx9007.github.io/vitrpress/ —— 所以 base 必须是 '/vitrpress/'。
   * 若将来改用自定义域名或 <user>.github.io 仓库，再改回 '/'。
   */
  base: '/vitrpress/',
  lang: 'zh-CN',
  /** 仓库地址，用于「在 GitHub 上编辑此页」 */
  repo: 'https://github.com/kx9007/vitrpress',
  /** 页脚版权名 */
  copyrightName: profile.name,
}

/** 导航栏 */
export const nav = [
  { text: '首页', link: '/' },
  { text: '项目', link: '/projects' },
  { text: 'API', link: '/api' },
  { text: '导航', link: '/nav' },
  { text: '博客', link: '/blog/' },
  { text: '关于', link: '/about' },
]

/**
 * 导航栏社交图标
 *
 * 只能使用 VitePress 内置图标集：
 * github / x / instagram / youtube / linkedin / discord / facebook / ...
 * QQ、微信、Gitee、TikTok 没有内置图标，放在首页「联系我」区块（见 contacts）。
 */
export const socialLinks = [
  { icon: 'github', link: 'https://github.com/kx9007' },
  { icon: 'x', link: 'https://x.com/' },
  { icon: 'instagram', link: 'https://instagram.com/' },
  { icon: 'youtube', link: 'https://youtube.com/' },
]

/**
 * 全部联系方式 —— 首页「联系我」区块与关于页共用
 *
 * kind:
 *   'copy'   没有可靠的主页链接（QQ、微信、邮箱），点击复制内容
 *   'link'   有主页链接，新窗口打开
 *
 * 想增删平台，直接改这个数组即可；图标按 key 自动匹配。
 */
export const contacts = [
  {
    key: 'qq',
    name: 'QQ',
    kind: 'copy',
    value: '1661993235',
    /** 点击后提示 */
    hint: '点击复制 QQ 号',
  },
  {
    key: 'wechat',
    name: '微信',
    kind: 'copy',
    value: 'kuxia9007',
    hint: '点击复制微信号',
  },
  {
    key: 'email',
    name: '邮箱',
    kind: 'link',
    value: 'kuxia9007@gmail.com',
    href: 'mailto:kuxia9007@gmail.com',
  },
  {
    key: 'github',
    name: 'GitHub',
    kind: 'link',
    value: 'https://github.com/kx9007',
    href: 'https://github.com/kx9007',
  },
  {
    key: 'gitee',
    name: 'Gitee',
    kind: 'link',
    value: 'gitee.com/kx9007',
    href: 'https://gitee.com/yourname',
  },
  {
    key: 'youtube',
    name: 'YouTube',
    kind: 'link',
    value: '暂不公开',
    href: 'https://youtube.com/',
  },
  {
    key: 'x',
    name: 'X',
    kind: 'link',
    value: '自己找',
    href: 'https://x.com/',
  },
  {
    key: 'instagram',
    name: 'Instagram',
    kind: 'link',
    value: '暂不公开',
    href: 'https://instagram.com/',
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    kind: 'link',
    value: '暂不公开',
    href: 'https://tiktok.com/',
  },
]


/**
 * 主题配色
 *
 * 颜色值不在这里写 —— 实际色值由 tools/gen-themes.py 生成到 theme/themes.css。
 * 这里只维护「有哪些主题、叫什么名字」，增删主题时两边都要动。
 */
export const DEFAULT_THEME = 'rainbow'

export const themes = [
  { id: 'rainbow', name: '七彩光谱' },
  { id: 'green', name: '不蕉绿' },
  { id: 'purple', name: '绝绝紫' },
  { id: 'blue', name: '不摆蓝' },
  { id: 'amber', name: '焦太宗' },
  { id: 'red', name: '发财红' },
] as const

/** 侧边栏（只对 /blog/ 下的文章生效） */
export const sidebar = {
  '/blog/': [
    {
      text: '博客',
      items: [
        { text: '全部文章', link: '/blog/' },
        {
          text: '2026',
          collapsed: false,
          items: [
            { text: '把 VitePress 变成个人主页', link: '/blog/build-homepage-with-vitepress' },
            { text: '如何组织一个组件库', link: '/blog/component-library-notes' },
            { text: '先测量，再优化', link: '/blog/measure-before-optimize' },
          ],
        },
      ],
    },
  ],
}

/** 首页数据条 */
export const stats = [
  { value: '5+', label: '年开发经验' },
  { value: '30+', label: '交付项目' },
  { value: '60+', label: '技术文章' },
  { value: '2.1k', label: 'GitHub Stars' },
]

/** 首页技术栈 */
/**
 * 技术栈。
 *
 * 首页会用「环绕球体」呈现：图标沿球面旋转，转到背面缩小淡出。
 * `slug` 是 simpleicons 的图标标识，用于取图标；
 * 找不到图标的项（如"性能优化"）会自动退回文字标签。
 */
export const skills = [
  { group: '语言', items: ['Flutter', 'JavaScript', 'HTML / CSS', 'Node.js'] },
  { group: '框架', items: ['Vue 3', 'React', 'NestJS', 'Vite'] },
  { group: '工程', items: ['VitePress', 'CI / CD', '单元测试', '性能优化'] },
  { group: '设计', items: ['全栈牛马', '前端设计', '后端维护'] },
]

/**
 * 环绕球体上显示的技术点。
 *
 * 分四类：语言 / 前端 / 后端与数据 / 工具与平台。
 * 图标统一走 simpleicons（品牌方官方图形）与 devicon（技术栈专库），
 * 全部已下载到 docs/public/img/tech/，不依赖外部 CDN。
 *
 * 数量控制在 30 个左右：再多球面会过密，图标互相压叠看不清。
 */
export const orbitTech = [
  // ---------- 语言 ----------
  { name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
  { name: 'JavaScript', slug: 'javascript', color: '#F7DF1E' },
  { name: 'Java', slug: 'java', color: '#0074BD' },
  { name: 'Python', slug: 'python', color: '#3776AB' },
  { name: 'Go', slug: 'go', color: '#00ADD8' },
  { name: 'Rust', slug: 'rust', color: '#DEA584' },
  { name: 'C++', slug: 'cplusplus', color: '#00599C' },
  { name: 'C#', slug: 'csharp', color: '#239120' },
  { name: 'PHP', slug: 'php', color: '#777BB4' },
  { name: 'Kotlin', slug: 'kotlin', color: '#7F52FF' },
  { name: 'HTML5', slug: 'html5', color: '#E34F26' },
  { name: 'CSS3', slug: 'css3', color: '#1572B6' },

  // ---------- 前端 ----------
  { name: 'Vue', slug: 'vuedotjs', color: '#41B883' },
  { name: 'React', slug: 'react', color: '#61DAFB' },
  { name: 'Vite', slug: 'vite', color: '#646CFF' },
  { name: 'VitePress', slug: 'vitepress', color: '#5C73E7' },
  { name: 'Sass', slug: 'sass', color: '#CC6699' },
  { name: 'Webpack', slug: 'webpack', color: '#8DD6F9' },
  { name: 'ESLint', slug: 'eslint', color: '#4B32C3' },
  { name: 'Flutter', slug: 'flutter', color: '#02569B' },

  // ---------- 后端与数据 ----------
  { name: 'Node.js', slug: 'nodedotjs', color: '#5FA04E' },
  { name: 'NestJS', slug: 'nestjs', color: '#E0234E' },
  { name: 'MySQL', slug: 'mysql', color: '#00618A' },
  { name: 'Redis', slug: 'redis', color: '#DC382D' },
  { name: 'Gradle', slug: 'gradle', color: '#02303A' },

  // ---------- 工具与平台 ----------
  { name: 'VS Code', slug: 'vscode', color: '#007ACC' },
  { name: 'IntelliJ IDEA', slug: 'idea', color: '#FE315D' },
  { name: 'Git', slug: 'git', color: '#F05032' },
  { name: 'GitHub', slug: 'github', color: '#C9D1D9' },
  { name: 'Docker', slug: 'docker', color: '#2496ED' },
  { name: 'Linux', slug: 'linux', color: '#FCC624' },
  { name: 'Android', slug: 'android', color: '#3DDC84' },
  { name: 'Figma', slug: 'figma', color: '#F24E1E' },
  { name: 'NPM', slug: 'npm', color: '#CB3837' },
]

/** 首页精选项目（完整列表见 docs/projects.md） */
export const projects = [
  {
    name: '爱尚云盘',
    desc: '一个对接openlist的云盘项目，弥补了openlist没有软件版的问题 ',
    tags: ['Flutter', 'Android', '前端开发'],
    stars: '5',
    link: 'https://github.com/kx9007/Ai-Cloud-Drive',
  },
  {
    name: '软阁-网页版软件库',
    desc: '早期写的一个网页版软件库，包含了一些常用的组件和工具。半成品',
    tags: ['html', 'css', 'javascript'],
    stars: '0',
    link: 'https://github.com/kx9007/ruange-app',
  },
  {
    name: '液态玻璃导航网',
    desc: '模仿ios26的液态玻璃写的导航系统',
    tags: ['PHP', 'HTML', 'JavaScript'],
    stars: '2',
    link: 'https://github.com/kx9007/liquid-glass-navigation-network',
  },
]

/** 首页最近文章。cover 为空时列表会自动退化成无图的紧凑样式。 */
export const posts = [
  {
    title: '先把代码写好，再考虑部署',
    date: '2026-10-20',
    desc: '这样写出来的代码才不烧心',
    link: 'https://www.google.com',
    cover: 'https://cdn.yppp.net/acg/pc/5.webp',
  },
  {
    title: '少用ai多动脑',
    date: '2026-09-12',
    desc: '明辨是非，理性思考',
    link: 'https://chatgpt.com/',
    cover: 'https://cdn.yppp.net/acg/pc/87.webp',
  },
  {
    title: '寻找灵感',
    date: '2026-08-03',
    desc: '从项目中提取灵感，而不是依赖ai',
    link: 'https://claude.com/',
    cover: 'https://cdn.yppp.net/acg/pc/189.webp',
  },
]

/**
 * API 站点
 *
 * status: online 正常 / unstable 不稳定 / maintenance 维护中 / offline 已下线
 * baseUrl 会做成「一键复制」按钮 —— 这是 API 站点最常被用到的信息。
 *
 * 想增删站点，改 apiData.ts；分类筛选会自动从 category 派生。
 *
 * 真实数据放在 apiData.ts —— 由 api.kxlove.top 的接口实现整理而来。
 * 这里重新导出，保持原有 import 路径不变。
 *
 * 每个站点除元信息外还带 `endpoints` 接口文档（方法 / 路径 / 参数 / 返回），
 * API 页会把它们渲染成可弹出的接口表，`required: true` 的参数标红点。
 */
export { apiSites } from './apiData'

/**
 * 导航网 —— 我的相关站点
 *
 * 每个分组下有若干站点。
 * icon 是 NavIcon 组件的 key（home / api / tools / code / fork / box /
 * pen / play / music / camera / palette / triangle / globe），
 * 全部为 SVG 双色渐变图标，不使用 emoji。
 */
export const navGroups = [
  {
    title: '我的作品',
    desc: '自己维护的产品与工具',
    items: [
      {
        name: '爱尚音乐',
        url: 'https://music.kxlove.top',
        desc: '永久免费的音乐下载器',
        icon: 'music',
        tag: '工具',
        featured: true,
      },
      {
        name: '爱尚云盘',
        url: 'https://cloud.kxlove.top',
        desc: '文件存储，可对接你的openlist',
        icon: 'cloud',
        tag: '工具',
        internal: true,
      },
      {
        name: 'funbox模块',
        url: 'https://tools.example.com',
        desc: '我为funbox准备的模块',
        icon: 'tools',
        tag: 'root模块',
      },
    ],
  },
  {
    title: '代码与项目',
    desc: '开源仓库与作品集',
    items: [
      {
        name: 'GitHub',
        url: 'https://github.com/yourname',
        desc: '开源项目与代码',
        icon: 'code',
        tag: '代码',
        featured: true,
      },
      {
        name: 'Gitee',
        url: 'https://gitee.com/yourname',
        desc: '国内镜像仓库',
        icon: 'fork',
        tag: '代码',
      },
      {
        name: '项目集',
        url: 'https://github.com/kx9007',
        desc: '我做过的项目一览',
        icon: 'box',
        tag: '作品',
        internal: true,
      },
    ],
  },
  {
    title: '内容与创作',
    desc: '写作、视频与分享',
    items: [
      {
        name: '哔哩哔哩',
        url: 'https://space.bilibili.com/580293704',
        desc: '懒人不爱更',
        icon: 'tv',
        tag: '教程',
        internal: true,
        featured: true,
      },
      {
        name: 'YouTube',
        url: 'https://youtube.com/',
        desc: '从来不发',
        icon: 'play',
        tag: '视频',
      },
      {
        name: 'TikTok',
        url: 'https://tiktok.com/',
        desc: '暂不考虑',
        icon: 'music',
        tag: '视频',
      },
      {
        name: 'Instagram',
        url: 'https://instagram.com/',
        desc: '暂不公开',
        icon: 'camera',
        tag: '日常',
      },
    ],
  },
  {
    title: '常用工具',
    desc: '提高效率的外部服务',
    items: [
      {
        name: 'Figma',
        url: 'https://figma.com',
        desc: '界面设计与原型',
        icon: 'palette',
        tag: '设计',
      },
      {
        name: 'Vercel',
        url: 'https://vercel.com',
        desc: '前端部署平台',
        icon: 'triangle',
        tag: '部署',
      },
      {
        name: 'Can I use',
        url: 'https://caniuse.com',
        desc: '浏览器兼容性查询',
        icon: 'globe',
        tag: '查询',
      },
    ],
  },
]
