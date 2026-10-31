/**
 * EdgeOne Pages 构建入口
 *
 * 与 GitHub Pages 的区别（详见 docs/.vitepress/config.mts 顶部注释）：
 *   - base 用根路径 '/'，因为 EdgeOne 分配的是根域名
 *   - 关闭 cleanUrls，链接保留 .html，避免平台不支持无后缀访问
 *
 * 用法：node tools/build-edgeone.mjs
 * （GitHub Actions 不走这个脚本，它用默认的 npm run build）
 */
import { spawnSync } from 'node:child_process'

const result = spawnSync('npx', ['vitepress', 'build', 'docs'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, DEPLOY_TARGET: 'edgeone' },
})

if (result.error) {
  console.error('[build:edgeone] 启动构建失败：', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
