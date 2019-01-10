import { warn } from '../util/warn'
import { extend } from '../util/misc'
import { genKey } from '../util/push-state'

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
    let vnodeCache = parent.$root['_vnodeCache'] || (parent.$root['_vnodeCache'] = [])
    let currentVnode
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
    currentVnode['key'] = genKey()
   
    const direction = router.direction
    const transitionName = direction==='back' && vnodeCache.length == 1 ? 'router-fade' : 'router-slid'
    setVnodeCache(direction, vnodeCache, currentVnode)
    domCached(vnodeCache)
    parent.$root['_vnodeCache'] = vnodeCache
    
    return h('transition-group', { attrs: {tag: 'div', name: transitionName} }, vnodeCache) 
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
function setVnodeCache (direction, vnodeCache, currentVnode) {
  if (direction === 'forward') {
    vnodeCache.push(currentVnode)
  } else if (direction === 'replace') {
    vnodeCache.splice(vnodeCache.length - 1, 1, currentVnode)
  } else if (direction === 'refresh') {
    vnodeCache.length = 0
    vnodeCache.push(currentVnode)
  } else if (direction === 'back') {
    if (vnodeCache.length === 1) { // 页面刷新之后回退
      vnodeCache.length = 0
      vnodeCache.push(currentVnode)
    } else {
      const { isCached, index } = matchPage(vnodeCache, currentVnode.tag)
      if (isCached) {
        vnodeCache.splice(index + 1, vnodeCache.length - index - 1)
      } else { //页面刷新=>页面前进=>页面回退（多步返回刷新之前的页面）
        vnodeCache.length = 0
        vnodeCache.push(currentVnode)
      }
    }
}
//处理dom的显示隐藏
function domCached (vnodeCache) {
    for(let i = 0; i < vnodeCache.length; i++) {
        if(!vnodeCache[i].elm) continue;
        const classList = vnodeCache[i].elm && vnodeCache[i].elm.classList || [];
        if(vnodeCache.length > 2) {
            if(i < vnodeCache.length - 2) {
                classList.add('cached')
            } else {
                classList.remove('cached')
            }
        } else if(classList.contains('cached')){
            classList.remove('cached')
        }
    }
}
