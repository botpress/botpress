'use strict'

var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i]
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key]
        }
      }
    }
    return target
  }

function _objectWithoutProperties(obj, keys) {
  var target = {}
  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue
    target[i] = obj[i]
  }
  return target
}

var injectDOMElement = function injectDOMElement(tagName, targetSelector) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {}

  var element = document.createElement(tagName)
  Object.keys(options).forEach(function(key) {
    return (element[key] = options[key])
  })
  document.querySelector(targetSelector).appendChild(element)
  return element
}

window.addEventListener('message', function(_ref) {
  var data = _ref.data

  if (!data || !data.type || data.type !== 'setClass') {
    return
  }
  document.querySelector('#bp-widget').setAttribute('class', data.value)
})

var init = function init(_ref2) {
  var _ref2$host = _ref2.host,
    host = _ref2$host === undefined ? '' : _ref2$host,
    _ref2$hideWidget = _ref2.hideWidget,
    hideWidget = _ref2$hideWidget === undefined ? false : _ref2$hideWidget,
    config = _objectWithoutProperties(_ref2, ['host', 'hideWidget'])

  var cssHref = host + '/api/botpress-platform-webchat/inject.css'
  injectDOMElement('link', 'head', { rel: 'stylesheet', href: cssHref })

  var options = encodeURIComponent(JSON.stringify({ hideWidget: hideWidget, config: config }))
  var iframeSrc = host + '/lite/?m=channel-web&v=embedded&options=' + options
  var iframeHTML = "<iframe id='bp-widget' frameborder='0' src='" + iframeSrc + "' />"
  injectDOMElement('div', 'body', { id: 'bp-web-widget', innerHTML: iframeHTML })

  var iframeWindow = document.querySelector('#bp-web-widget > #bp-widget').contentWindow
  var configure = function configure(payload) {
    return iframeWindow.postMessage({ action: 'configure', payload: payload }, '*')
  }
  var sendEvent = function sendEvent(payload) {
    return iframeWindow.postMessage({ action: 'event', payload: payload }, '*')
  }

  window.botpressWebChat = _extends({}, window.botpressWebChat, { configure: configure, sendEvent: sendEvent })
}

window.botpressWebChat = { init: init }
