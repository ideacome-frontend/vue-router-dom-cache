/* @flow */

import { inBrowser } from './dom'
import { saveScrollPosition } from './scroll'

export const supportsPushState = inBrowser && (function () {
  const ua = window.navigator.userAgent

  if (
    (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
    ua.indexOf('Mobile Safari') !== -1 &&
    ua.indexOf('Chrome') === -1 &&
    ua.indexOf('Windows Phone') === -1
  ) {
    return false
  }

  return window.history && 'pushState' in window.history
})()

// use User Timing api (if present) for more accurate key precision
const Time = inBrowser && window.performance && window.performance.now
  ? window.performance
  : Date

let _key: string = genKey()

export function genKey (): string {
  return Time.now().toFixed(3)
}

export function setRouterHistory (url?: string) {
  //将key作为每个页面的唯一标示，用于在popstate监听事件里面判断页面的前进后退
  let historyListString = sessionStorage.getItem('routerHistoryKeyList')
  let list = historyListString && JSON.parse(historyListString) || []
  //跳转到某个页面刷新不需要重新添加该页面的url到历史记录
  let isNeedPush = !url && list.length && (window.location.href == list[list.length - 1].url)
  if(!isNeedPush){
    list.push({
      key: _key, 
      url: url ? url: window.location.href
    })
  }

  sessionStorage.setItem('routerHistoryKeyList', JSON.stringify(list)) 
}

export function getStateKey () {
  return _key
}

export function setStateKey (key: string) {
  _key = key
}

export function pushState (url?: string, replace?: boolean) {
  saveScrollPosition()
  // try...catch the pushState call to get around Safari
  // DOM Exception 18 where it limits to 100 pushState calls
  const history = window.history
  try {
    if (replace) {
      history.replaceState({ key: _key }, '', url)
    } else {
      _key = genKey()
      history.pushState({ key: _key }, '', url)
      setRouterHistory(url)
    }
  } catch (e) {
    window.location[replace ? 'replace' : 'assign'](url)
  }
}

export function replaceState (url?: string) {
  pushState(url, true)
}
