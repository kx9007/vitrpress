/**
 * 站内链接生成 —— 同时兼容两种托管环境
 *
 * 同一个仓库要部署到两个平台，两者对 URL 的要求不同：
 *
 *   1. GitHub Pages（项目页）
 *      地址形如 https://kx9007.github.io/vitrpress/
 *      → 站点在 /vitrpress/ 子路径下，资源前缀必须是 /vitrpress/
 *      → 支持 cleanUrls，链接可以省略 .html（/about）
 *
 *   2. EdgeOne Pages
 *      地址形如 https://xxx.edgeone.app/
 *      → 站点在根路径，前缀必须是 /
 *      → 不保证支持"无后缀访问"，/about 会 404，必须写成 /about.html
 *
 * 构建时 config.mts 通过 vite.define 注入 __CLEAN_URLS__，
 * 这里据此决定要不要补 .html，避免为两个平台维护两份源码。
 */
import { withBase } from 'vitepress'

declare const __CLEAN_URLS__: boolean

/**
 * 把站内路径转成当前构建目标下的正确链接。
 *
 * @param path 以 / 开头的站内路径，如 '/projects'、'/blog/'
 *             （带结尾 / 的目录入口不做 .html 处理，如 '/blog/'）
 */
export function pageUrl(path: string): string {
  // typeof 保护：万一 define 没注入，退回到 cleanUrls 的行为，不至于整站崩掉
  const cleanUrls = typeof __CLEAN_URLS__ !== 'undefined' ? __CLEAN_URLS__ : true

  let p = path
  // 只看最后一段是否有扩展名：/img/tech/vue.svg 有 → 是静态资源，不能补 .html
  const lastSegment = p.split('/').pop() ?? ''
  const hasExtension = /\.[a-z0-9]+$/i.test(lastSegment)

  const needsHtml =
    !cleanUrls && !p.endsWith('/') && !hasExtension && !p.startsWith('http')

  if (needsHtml) p += '.html'

  return withBase(p)
}
