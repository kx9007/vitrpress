import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import HeroCinema from './components/HeroCinema.vue'
import RouteTransition from './components/RouteTransition.vue'
import ScrollReveal from './components/ScrollReveal.vue'
import HomeSections from './components/HomeSections.vue'
import ThemeSwitch from './components/ThemeSwitch.vue'
import ThemePicker from './components/ThemePicker.vue'
import ContactList from './components/ContactList.vue'
import ApiShowcase from './components/ApiShowcase.vue'
import NavSites from './components/NavSites.vue'
import BlogList from './components/BlogList.vue'
import Live2DMascot from './components/Live2DMascot.vue'
import './themes.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    /*
     * 路由转场 / 滚动动效的驱动放在这里。
     * 原因：Layout 会在每次路由变化时重建，写在组件里监听器会丢；
     * enhanceApp 只在应用启动时执行一次，是唯一稳定的挂载点。
     */
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      let timer: number | undefined

      const fireFx = () => {
        root.classList.remove('fx-out', 'fx-in')
        // 强制重排，让动画能重新触发
        void root.offsetWidth
        root.classList.add('fx-out')
        window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          root.classList.remove('fx-out')
          root.classList.add('fx-in')
          timer = window.setTimeout(() => root.classList.remove('fx-in'), 640)
        }, 220)
      }

      /*
       * 路由切换后重新接管新页面的元素。
       *
       * 旧实现会先把 .reveal-init / .reveal-done 清掉再重扫，
       * 但新版的 ScrollReveal 用 .rv / .rv-out 两个类，
       * 并且用 WeakSet 记过已处理的元素——所以这里只需要
       * 触发一次重扫事件，让组件自己去 prepare 新出现的节点。
       */
      const rescanReveal = () => {
        window.setTimeout(() => {
          document.dispatchEvent(new CustomEvent('scan-reveal'))
        }, 90)
      }

      /*
       * 不依赖 VitePress 的 onAfterRouteChanged ——
       * 实测在部分版本/场景下不会触发。
       * 改为轮询 URL 变化，这是最可靠的方式（代价极小）。
       */
      let lastPath = location.pathname
      const watch = () => {
        if (location.pathname === lastPath) return
        lastPath = location.pathname
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        fireFx()
        rescanReveal()
      }
      window.setInterval(watch, 120)
      window.addEventListener('popstate', watch)
    }

    app.component('HeroCinema', HeroCinema)
    app.component('HomeSections', HomeSections)
    app.component('ContactList', ContactList)
    app.component('ApiShowcase', ApiShowcase)
    app.component('NavSites', NavSites)
    app.component('BlogList', BlogList)
  },

  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 用三态切换（浅色 / 深色 / 跟随系统）替换内置的两态开关
      'nav-bar-content-after': () =>
        h('div', { class: 'nav-actions' }, [h(ThemePicker), h(ThemeSwitch)]),
      // 路由切换动画 + 滚动进场动效，挂在布局层保证每页都生效
      'layout-top': () => [h(RouteTransition), h(ScrollReveal)],
      // 左下角 Live2D 看板娘，挂在布局层保证每页都在
      'layout-bottom': () => h(Live2DMascot),
    })
  },
} satisfies Theme
