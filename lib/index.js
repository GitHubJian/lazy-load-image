var { extend, throttle } = require('./utils')
var $ = require('./$')

var defaults = {
  data: 'src',
  selector: '.lazyload',
  convert: function(src) {
    return src
  },
  placeholder:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC',
  throttleTime: 1e2
}

function offset(el) {
  var top
  for (top = el.offsetTop; el.offsetParent; ) {
    el = el.offsetParent
    if (window.navigator.userAgent.indexOf('MSTE 8') > -1) {
      top += el.offsetTop
    } else {
      top += el.offsetTop + el.clientTop
    }
  }

  return {
    top: top
  }
}

function checkInView(el, i) {
  try {
    var innerHeight = window.innerHeight,
      scrollTop = document.body.scrollTop || document.documentElement.scrollTop,
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
  } catch (e) {
    console.error('LazyLoad Error at [' + i + '}]')

    return false
  }
}

function LazyLoad(options) {
  var settings = extend(true, defaults, options)

  this.settings = settings

  this._init()

  this.traversal()
}

LazyLoad.prototype._init = function() {
  this._createTraversal()

  this._addEvent()
}

LazyLoad.prototype._addEvent = function() {
  var that = this

  var scrollListener = throttle(this.traversal, that.settings.throttleTime)

  $(window).on('scroll', scrollListener)
}

LazyLoad.prototype._createTraversal = function() {
  var that = this

  this.traversal = function() {
    var $els = $(that.settings.selector)
    var i = 0

    for (; i < $els.length; i++) {
      var el = $els[i]

      if (checkInView(el, i)) {
        ;(function() {
          var $el = $(el)

          var orisrc = $el[0].getAttribute('data-' + that.settings.data)
          var src =
            (that.settings.convert && that.settings.convert(orisrc)) ||
            that.settings.placeholder

          $el.attr('src', src)

          $el.on('load', function() {
            $el.removeClass(that.settings.selector.slice(1))
          })

          $el.on('error', function() {
            $el.removeClass(that.settings.selector.slice(1))

            $el.attr('src', that.settings.placeholder)
          })
        })()
      }
    }
  }
}

module.exports = LazyLoad
