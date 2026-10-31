import { defineConfig } from 'vitepress'
import { site, nav, socialLinks, profile, sidebar } from './profile'

/**
 * 部署目标 —— 同一份代码要发到两个平台，它们的环境要求不同
 *
 *   pnpm build:edgeone / npm run build:edgeone
 *     根路径（base '/'）、保留 .html（cleanUrls 关闭）
 *     EdgeOne Pages 分配的是根域名，且不保证支持无后缀访问
 *
 *   默认（不设 DEPLOY_TARGET，或设为 github）
 *     子路径 /vitrpress/、cleanUrls 开启
 *     对应 https://kx9007.github.io/vitrpress/
 */
const target = process.env.DEPLOY_TARGET ?? 'github'
const isEdgeOne = target === 'edgeone'

const base = isEdgeOne ? '/' : site.base
const cleanUrls = !isEdgeOne

export default defineConfig({
  lang: site.lang,
  title: site.title,
  description: site.description,
  base,
  cleanUrls,
  lastUpdated: true,

  vite: {
    // 供 theme/url.ts 判断是否需要在链接里补 .html
    define: {
      __CLEAN_URLS__: JSON.stringify(cleanUrls),
    },
  },

  head: [
    [
      'script',
      {},
      // 在 CSS 生效前就把 data-theme 打上，避免首屏用默认色再跳变
      `(function(){try{var t=localStorage.getItem('site-theme-color');var ok=['rainbow','green','purple','blue','amber','red'];document.documentElement.setAttribute('data-theme',t&&ok.indexOf(t)>-1?t:'rainbow')}catch(e){document.documentElement.setAttribute('data-theme','rainbow')}})()`,
    ],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { name: 'author', content: profile.name }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: site.title }],
    ['meta', { property: 'og:description', content: site.description }],
  ],

  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: site.title,

    nav,
    socialLinks,
    sidebar,

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '外观',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    lastUpdatedText: '最后更新',

    editLink: {
      pattern: `${site.repo}/edit/main/docs/:path`,
      text: '在 GitHub 上编辑此页',
    },
  },
})
