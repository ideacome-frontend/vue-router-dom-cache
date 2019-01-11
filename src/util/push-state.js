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
let _index: number = genIndex()

export function genKey (): string {
  return Time.now().toFixed(3)
}

function genIndex (): number {
  const history = inBrowser && window.history ? window.history : {}
  const index = history.state && history.state['index'] || 0
  return index
}

export function getStateKey () {
  return _key
}

export function setStateKey (key: string) {
  _key = key
}

export function getStateIndex () {
  return _index
}

export function setStateIndex (index: number) {
  _index = index
}

export function pushState (url?: string, replace?: boolean) {
  saveScrollPosition()
  // try...catch the pushState call to get around Safari
  // DOM Exception 18 where it limits to 100 pushState calls
  const history = window.history
  try {
    if (replace) {
      history.replaceState({ key: _key, index: _index }, '', url)
    } else {
      _key = genKey()
      const index = _index + 1
      history.pushState({ key: _key, index: index }, '', url)
      setStateIndex(index)
    }
  } catch (e) {
    window.location[replace ? 'replace' : 'assign'](url)
  }
}

export function replaceState (url?: string) {
  pushState(url, true)
}
