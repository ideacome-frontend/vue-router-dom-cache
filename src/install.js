import View from './components/view'
import Views from './components/views'
import Link from './components/link'

export let _Vue

export function install (Vue) {
  if (install.installed && _Vue === Vue) return
  install.installed = true

  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    // 至少存在一个 VueComponent 时, _parentVnode 属性才存在
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

  Vue.mixin({
    beforeCreate () {
      /**
       * this.$options.router 是vue app 创建的的是注入的
       * const app = new Vue({
       *   router
       * }).$mount('#app')
       */
      // 判断是否传入了 router
      if (isDef(this.$options.router)) {
        // 将 router 的根组件指向 Vue 实例
        this._routerRoot = this
        this._router = this.$options.router
        // 初始化 router
        this._router.init(this)
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        // 用于查找 router-view 组件的层次判断
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      // 注册 VueComponent，进行 observer 处理，把当前的router-view组件添加到对应的路由记录的instance里面
      registerInstance(this, this)
    },
    destroyed () {
      // 取消 VueComponent 的注册，router-view组件destoryed的时候将该路由记录的instance置为undefined
      registerInstance(this)
    }
  })

  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })

  Vue.component('RouterView', View)
  Vue.component('RouterViews', Views)
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
