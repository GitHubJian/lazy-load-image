/**
 * Image Lazy Load
 * @author Xiao WS
 * @desc 图片懒加载，支持 Observer 监听函数
 * @options
 *  container -> 监听容器 default: document.body
 *  className -> 需要懒加载的类名
 *  dataAttribute -> 懒加载临时存储属性 default: data-src
 *  placeholderImage -> 加载失败时Base64Img
 *  successCallback() -> 加载成功时的回调
 *  failureCallback(src) -> 加载失败时的回调
 *  changeRealUrl(src) -> 根据 src 获取真实的 url
 *  rootMargin -> IntersectionObserver rootMargin
 *  threshold -> IntersectionObserver threshold
 *
 * @link
 *  https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver
 *  https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver
 */

;(function(global, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory()
  } else if (typeof define === 'function' && define.amd) {
    define([], factory())
  } else if (typeof exports === 'object') {
    exports['lazyload'] = factory()
  } else {
    global['lazyload'] = factory()
  }
})(this, function() {
  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
      let T, k

      if (this === null) {
        throw new TypeError('this is null or not defined')
      }

      const O = Object(this)

      const len = O.length >>> 0

      if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function')
      }

      if (arguments.length > 1) {
        T = thisArg
      }

      k = 0

      while (k < len) {
        var kValue

        if (k in O) {
          kValue = O[k]

          callback.call(T, kValue, k, O)
        }

        k++
      }
    }
  }

  function throttle(func, wait, options) {
    let timeout, context, args, result
    let previous = 0
    if (!options) options = {}

    const later = function() {
      previous = options.leading === false ? 0 : +new Date()
      timeout = null
      result = func.apply(context, args)
      if (!timeout) content = args = null
    }

    const throttled = function() {
      const now = +new Date()
      if (!previous && options.leading === false) previous = now

      const remaining = wait - (now - previous)
      context = this
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        previous = now
        result = func.apply(context, args)
        if (!timeout) context = args = null
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining)
      }

      return result
    }

    throttled.cancel = function() {
      clearTimeout(timeout)
      previous = 0
      timeout = context = args = null
    }

    return throttled
  }

  // 支持 Observer
  const isSupportObserver =
    window.IntersectionObserver && window.MutationObserver
  let intersectionObserver, mutationObserver

  const noop = _ => _ // 空函数

  // 默认配置项
  const defaultConfig = {
    className: 'lazyload',
    threshold: [0],
    rootMargin: '0px',
    // TODO: scroll
    // event: 'scroll',
    container: document.body,
    dataAttribute: 'data-src',
    placeholderImage:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC',
    throttleTime: 3e2,
    successCallback: noop,
    failureCallback: noop,
    changeRealUrl: noop
  }

  function hasClass(element, value) {
    return element.classList
      ? element.classList.contains(value)
      : element.className.indexOf(value) > -1
  }

  function removeClass(element, value) {
    if (!value) {
      return
    }

    if (element.classList) {
      element.classList.remove(value)

      return
    }

    if (element.className.indexOf(value) >= 0) {
      element.className = element.className.replace(value, ' ')
    }
  }

  function on(element, event, handler) {
    if (document.addEventListener) {
      if (element && event && handler) {
        element.addEventListener(event, handler, false)
      }
    } else {
      if (element && event && handler) {
        element.attachEvent('on' + event, handler)
      }
    }
  }

  function once(element, event, handler) {
    let called = false
    on(element, event, function() {
      if (!called) {
        called = true
        handler.apply(this, arguments)
      }
    })
  }

  function extend(to, _from) {
    for (const key in _from) {
      to[key] = _from[key]
    }

    return to
  }

  // 获取元素的 offset 属性，兼容低版本浏览器
  function offset(el) {
    let top, left
    for (top = el.offsetTop, left = el.offsetLeft; el.offsetParent; ) {
      el = el.offsetParent
      if (window.navigator.userAgent.indexOf('MSTE 8') > -1) {
        top += el.offsetTop
        left += el.offsetLeft
      } else {
        top += el.offsetTop + el.clientTop
        left += el.offsetLeft + el.clientLeft
      }
    }

    return {
      left,
      top
    }
  }

  // 是否处于视口中
  function isVisualRange(el) {
    try {
      const innerHeight = window.innerHeight,
        scrollTop =
          document.body.scrollTop || document.documentElement.scrollTop,
        clientHeight = el.clientHeight
          ? el.clientHeight
          : el.parentNode.clientHeight,
        top = offset(el).top

      return (
        (top >= scrollTop && top <= scrollTop + innerHeight) ||
        (top < scrollTop &&
          top + clientHeight > scrollTop &&
          top + clientHeight < scrollTop + innerHeight)
      )
    } catch (ex) {
      return !1
    }
  }

  // 绑定 observer 监听器
  function bindObserverHandler(el, observer) {
    if (el.getAttribute('data-observer') !== 'true') {
      observer.observe(el)

      el.setAttribute('data-observer', 'true')
    }
  }

  // 入口函数
  return function(config) {
    config = extend(defaultConfig, config)

    let container = config.container
    if ('string' === typeof container) {
      container = document.getElementById(container)
      config.container = container
    }

    // 是否加载完成
    function isLoaded(el) {
      return !hasClass(el, config.className)
    }

    // 加载完成处理器
    function loadedHandler(el) {
      return removeClass(el, config.className)
    }

    // 非observer处理器
    function traversalHandler(container, className) {
      return function() {
        Array.prototype.slice
          .call(container.getElementsByClassName(className) || [])
          .forEach(function(el) {
            isVisualRange(el) && loadHandler(el)
          })
      }
    }

    // 加载图片处理器
    var loadHandler = (function(callback) {
      return function(el) {
        let src = el.getAttribute(config.dataAttribute)
        src = config.changeRealUrl(src)

        el.setAttribute('src', src)

        once(el, 'load', function() {
          callback && callback(el)
          config.successCallback && config.successCallback()
        })

        once(el, 'abort', function() {
          el.setAttribute('src', config.placeholderImage)

          callback && callback(el)
          config.failureCallback && config.failureCallback(src)
        })

        once(el, 'error', function(e) {
          el.setAttribute('src', config.placeholderImage)

          callback && callback(el)
          config.failureCallback && config.failureCallback(src)
        })
      }
    })(loadedHandler)

    function load() {
      if (isSupportObserver) {
        const intersectionObserverHandler = (function(dataAttribute, callback) {
          return function(entries, observer) {
            entries.forEach(function(entry) {
              // entry.intersectionRatio > 0有兼容问题
              if (entry.isIntersecting != undefined) {
                if (!entry.isIntersecting) return false
              } else if (entry.intersectionRect != undefined) {
                if (
                  !(
                    entry.intersectionRect.width ||
                    entry.intersectionRect.height ||
                    entry.intersectionRect.bottom ||
                    entry.intersectionRect.top ||
                    entry.intersectionRect.left ||
                    entry.intersectionRect.right
                  )
                )
                  return false
              }

              if (!entry.target.getAttribute(dataAttribute)) {
                return false
              }

              observer.unobserve(entry.target)

              if (!isLoaded(entry.target)) {
                callback(entry.target)
              }
            })
          }
        })(config.dataAttribute, loadHandler)

        intersectionObserver = new window.IntersectionObserver(
          intersectionObserverHandler,
          {
            rootMargin: config.rootMargin,
            threshold: config.threshold
          }
        )

        mutationObserver = new MutationObserver(function() {
          Array.prototype.slice
            .call(
              config.container.getElementsByClassName(config.className) || []
            )
            .forEach(function(el) {
              bindObserverHandler(el, intersectionObserver)
            })
        })

        if (config.container) {
          mutationObserver.observe(config.container, {
            childList: true,
            subtree: true
          })
        }

        Array.prototype.slice
          .call(config.container.getElementsByClassName(config.className) || [])
          .forEach(function(el) {
            if (isLoaded(el)) return true
            if (intersectionObserver) {
              bindObserverHandler(el, intersectionObserver)
              return true
            }

            loadHandler(el)
          })
      } else {
        const traversal = traversalHandler(config.container, config.className)

        const onScrollListener = throttle(traversal, config.throttleTime)

        config.container.tagName === 'BODY'
          ? on(window, 'scroll', onScrollListener)
          : on(config.container, 'scroll', onScrollListener)

        traversal()
      }
    }

    return {
      load
    }
  }
})
