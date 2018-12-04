import { warn } from '../util/warn'
import { extend } from '../util/misc'

export default {
  name: 'RouterViews',
  functional: true,
  props: {
    name: {
      type: String,
      default: 'default'
    }
  },
  render (_, { props, children, parent, data }) {
    // used by devtools to display a router-view badge
    data.routerView = true

    // directly use parent context's createElement() function
    // so that components rendered by router-view can resolve named slots
    const h = parent.$createElement
    const name = props.name
    const route = parent.$route
    const router = parent.$router
    const cache = parent._routerViewCache || (parent._routerViewCache = {})
    let vnodeCache = parent._vnodeCache || (parent._vnodeCache = [])
    let currentVnode;
    // determine current view depth, also check to see if the tree
    // has been toggled inactive but kept-alive.
    let depth = 0
    let inactive = false
    while (parent && parent._routerRoot !== parent) {
      if (parent.$vnode && parent.$vnode.data.routerView) {
        depth++
      }
      if (parent._inactive) {
        inactive = true
      }
      parent = parent.$parent
    }
    data.routerViewDepth = depth

    // render previous view if the tree is inactive and kept-alive
    if (inactive) {
        console.log(cache[name])
        currentVnode = h(cache[name], data, children)
        //   return h(cache[name], data, children)
    } else {
        const matched = route.matched[depth]
        // render empty node if no matched route
        if (!matched) {
            cache[name] = null
            return h()
        }

        const component = cache[name] = matched.components[name]

        // attach instance registration hook
        // this will be called in the instance's injected lifecycle hooks
        data.registerRouteInstance = (vm, val) => {
            // val could be undefined for unregistration
            const current = matched.instances[name]
            if (
                (val && current !== vm) ||
                (!val && current === vm)
            ) {
                matched.instances[name] = val
            }
        }

        // also register instance in prepatch hook
        // in case the same component instance is reused across different routes
        ;(data.hook || (data.hook = {})).prepatch = (_, vnode) => {
            matched.instances[name] = vnode.componentInstance
        }

        // resolve props
        let propsToPass = data.props = resolveProps(route, matched.props && matched.props[name])
        if (propsToPass) {
            // clone to prevent mutation
            propsToPass = data.props = extend({}, propsToPass)
            // pass non-declared props as attrs
            const attrs = data.attrs = data.attrs || {}
            for (const key in propsToPass) {
                if (!component.props || !(key in component.props)) {
                attrs[key] = propsToPass[key]
                delete propsToPass[key]
                }
            }
        }
        currentVnode = h(component, data, children)
    }
    if(router.direction!=='back') {
        currentVnode['key'] = Date.now()
    }
    console.log(currentVnode)
    const direction = router.direction
    //向前跳转需要将vnode push 入 vnodeCache并渲染，还需要将除当前组件外的vnode对象置为隐藏
    if(router.direction==='forward'){
        vnodeCache.push(currentVnode)
    }
    // redirect need to replace
    else if(router.direction==='replace'){
        vnodeCache.splice(vnodeCache.length - 1, 1, currentVnode)
    }
    // refresh
    else if(router.direction==='refresh'){
        vnodeCache.push(currentVnode)
    }
    //back need to pop 
    else if(router.direction==='back'){
        if(vnodeCache.length === 1){ //页面刷新之后回退
            vnodeCache = [currentVnode];
        }else{
            const {isCached, index} = matchPage(vnodeCache, currentVnode.tag)
            if(isCached) {
                vnodeCache.splice(index + 1, vnodeCache.length - index - 1)
            }
        }
    }
    console.log(vnodeCache)
    // const needShowVnodeCache = vnodeCache.length > 2 ? vnodeCache.slice(vnodeCache.length - 2) : vnodeCache
    // let transitionName;
    // if(vnodeCache.length>1){
        // transitionName = 'router-slid'
    // }else{
    //     transitionName = 'fade'
    // }

    //处理dom的显示隐藏
    if(vnodeCache.length > 2) {
        for(let i = 0; i < vnodeCache.length - 2; i++) {
            const staticClass = vnodeCache[i].data.staticClass;
            if(staticClass && staticClass.indexOf('none') < 0) {
                vnodeCache[i].data.staticClass = staticClass + ' none'
            }
        }
    } else {
        vnodeCache.forEach((vnode, index) => {
            vnode.data.staticClass && vnode.data.staticClass.replace(/ none/, '')
        }) 
    }
    return h('transition-group', { attrs: {tag: 'div', name: 'router-slid'} }, vnodeCache)
    
  }
}
function matchPage (vnodeCache, tag) {
    let isCached = false, index = 0
    vnodeCache.forEach((vnode, i) => {
        if (vnode.tag === tag) {
            isCached = true
            index = i
        }
    });
    return {
        isCached: isCached,
        index: index
    }
}
function resolveProps (route, config) {
  switch (typeof config) {
    case 'undefined':
      return
    case 'object':
      return config
    case 'function':
      return config(route)
    case 'boolean':
      return config ? route.params : undefined
    default:
      if (process.env.NODE_ENV !== 'production') {
        warn(
          false,
          `props in "${route.path}" is a ${typeof config}, ` +
          `expecting an object, function or boolean.`
        )
      }
  }
}
