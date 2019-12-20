var doc = document,
  win = window

var Dom7 = function Dom7(arr) {
  var self = this
  // Create array-like object
  for (var i = 0; i < arr.length; i += 1) {
    self[i] = arr[i]
  }
  self.length = arr.length
  // Return collection with methods
  return this
}

function $(selector, context) {
  var arr = []
  var i = 0
  if (selector && !context) {
    if (selector instanceof Dom7) {
      return selector
    }
  }
  if (selector) {
    // String
    if (typeof selector === 'string') {
      var els
      var tempParent
      var html = selector.trim()
      if (html.indexOf('<') >= 0 && html.indexOf('>') >= 0) {
        var toCreate = 'div'
        if (html.indexOf('<li') === 0) {
          toCreate = 'ul'
        }
        if (html.indexOf('<tr') === 0) {
          toCreate = 'tbody'
        }
        if (html.indexOf('<td') === 0 || html.indexOf('<th') === 0) {
          toCreate = 'tr'
        }
        if (html.indexOf('<tbody') === 0) {
          toCreate = 'table'
        }
        if (html.indexOf('<option') === 0) {
          toCreate = 'select'
        }
        tempParent = doc.createElement(toCreate)
        tempParent.innerHTML = html
        for (i = 0; i < tempParent.childNodes.length; i += 1) {
          arr.push(tempParent.childNodes[i])
        }
      } else {
        if (!context && selector[0] === '#' && !selector.match(/[ .<>:~]/)) {
          // Pure ID selector
          els = [doc.getElementById(selector.trim().split('#')[1])]
        } else {
          // Other selectors
          els = (context || doc).querySelectorAll(selector.trim())
        }
        for (i = 0; i < els.length; i += 1) {
          if (els[i]) {
            arr.push(els[i])
          }
        }
      }
    } else if (selector.nodeType || selector === win || selector === doc) {
      // Node/element
      arr.push(selector)
    } else if (selector.length > 0 && selector[0].nodeType) {
      // Array of elements or instance of Dom
      for (i = 0; i < selector.length; i += 1) {
        arr.push(selector[i])
      }
    }
  }
  return new Dom7(arr)
}

$.fn = Dom7.prototype
$.Dom7 = Dom7

function removeClass(className) {
  var classes = className.split(' ')
  for (var i = 0; i < classes.length; i += 1) {
    for (var j = 0; j < this.length; j += 1) {
      if (
        typeof this[j] !== 'undefined' &&
        typeof this[j].classList !== 'undefined'
      ) {
        this[j].classList.remove(classes[i])
      }
    }
  }
  return this
}

function data(key, value) {
  var el
  if (typeof value === 'undefined') {
    el = this[0]
    // Get value
    if (el) {
      if (el.dom7ElementDataStorage && key in el.dom7ElementDataStorage) {
        return el.dom7ElementDataStorage[key]
      }

      var dataKey = el.getAttribute('data-' + key)
      if (dataKey) {
        return dataKey
      }
      return undefined
    }
    return undefined
  }

  // Set value
  for (var i = 0; i < this.length; i += 1) {
    el = this[i]
    if (!el.dom7ElementDataStorage) {
      el.dom7ElementDataStorage = {}
    }
    el.dom7ElementDataStorage[key] = value
  }
  return this
}

function on() {
  var assign

  var args = [],
    len = arguments.length
  while (len--) args[len] = arguments[len]
  var eventType = args[0]
  var targetSelector = args[1]
  var listener = args[2]
  var capture = args[3]
  if (typeof args[1] === 'function') {
    ;(assign = args),
      (eventType = assign[0]),
      (listener = assign[1]),
      (capture = assign[2])
    targetSelector = undefined
  }
  if (!capture) {
    capture = false
  }

  function handleLiveEvent(e) {
    var target = e.target
    if (!target) {
      return
    }
    var eventData = e.target.dom7EventData || []
    if (eventData.indexOf(e) < 0) {
      eventData.unshift(e)
    }
    if ($(target).is(targetSelector)) {
      listener.apply(target, eventData)
    } else {
      var parents = $(target).parents() // eslint-disable-line
      for (var k = 0; k < parents.length; k += 1) {
        if ($(parents[k]).is(targetSelector)) {
          listener.apply(parents[k], eventData)
        }
      }
    }
  }

  function handleEvent(e) {
    var eventData = e && e.target ? e.target.dom7EventData || [] : []
    if (eventData.indexOf(e) < 0) {
      eventData.unshift(e)
    }
    listener.apply(this, eventData)
  }

  var events = eventType.split(' ')
  var j
  for (var i = 0; i < this.length; i += 1) {
    var el = this[i]
    if (!targetSelector) {
      for (j = 0; j < events.length; j += 1) {
        var event = events[j]
        if (!el.dom7Listeners) {
          el.dom7Listeners = {}
        }
        if (!el.dom7Listeners[event]) {
          el.dom7Listeners[event] = []
        }
        el.dom7Listeners[event].push({
          listener: listener,
          proxyListener: handleEvent
        })
        el.addEventListener(event, handleEvent, capture)
      }
    } else {
      // Live events
      for (j = 0; j < events.length; j += 1) {
        var event$1 = events[j]
        if (!el.dom7LiveListeners) {
          el.dom7LiveListeners = {}
        }
        if (!el.dom7LiveListeners[event$1]) {
          el.dom7LiveListeners[event$1] = []
        }
        el.dom7LiveListeners[event$1].push({
          listener: listener,
          proxyListener: handleLiveEvent
        })
        el.addEventListener(event$1, handleLiveEvent, capture)
      }
    }
  }
  return this
}

function attr(attrs, value) {
  var arguments$1 = arguments

  if (arguments.length === 1 && typeof attrs === 'string') {
    // Get attr
    if (this[0]) {
      return this[0].getAttribute(attrs)
    }
    return undefined
  }

  // Set attrs
  for (var i = 0; i < this.length; i += 1) {
    if (arguments$1.length === 2) {
      // String
      this[i].setAttribute(attrs, value)
    } else {
      // Object
      // eslint-disable-next-line
      for (var attrName in attrs) {
        this[i][attrName] = attrs[attrName]
        this[i].setAttribute(attrName, attrs[attrName])
      }
    }
  }
  return this
}

var Methods = {
  removeClass: removeClass,
  data: data,
  on: on,
  attr: attr
}

for (var methodName in Methods) {
  if (Object.prototype.hasOwnProperty.call(Methods, methodName)) {
    $.fn[methodName] = $.fn[methodName] || Methods[methodName]
  }
}

module.exports = $
