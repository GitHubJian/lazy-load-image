var _toString = Object.prototype.toString
var _slice = Array.prototype.slice

function isArray(array) {
  return _toString.call(array) === '[object Array]'
}

function isObject(object) {
  return _toString.call(object) === '[object Object]'
}

function isPlainObject(object) {
  return isObject(object) && Object.getPrototypeOf(object) == Object.prototype
}

function _extend(target, source, deep) {
  for (var key in source) {
    if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
      if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
        target[key] = {}
      }
      if (isArray(source[key]) && !isArray(target[key])) {
        target[key] = []
      }
      _extend(target[key], source[key], deep)
    } else if (source[key] !== void 0) {
      target[key] = source[key]
    }
  }
}

function extend(target) {
  var deep,
    arg,
    args = _slice.call(arguments, 1)

  if (typeof target == 'boolean') {
    deep = target
    target = args.shift()
  }

  var i, len
  for (i = 0, len = args.length; i < len; i++) {
    arg = args[i]
    _extend(target, arg, deep)
  }

  return target
}

exports.extend = extend

function clone(value, deep) {
  deep = deep === true

  return extend(deep, {}, value)
}

exports.clone = clone

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

exports.throttle = throttle
