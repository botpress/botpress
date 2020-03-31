function injectDOMElement(tagName, targetSelector, options) {
  const element = document.createElement(tagName)
  if (options) {
    Object.keys(options).forEach(function(key) {
      element[key] = options[key]
    })
  }
  document.querySelector(targetSelector).appendChild(element)
  return element
}

window.addEventListener('message', function(payload) {
  const data = payload.data
  if (!data || !data.type) {
    return
  }

  if (data.type === 'setClass') {
    document.querySelector('#bp-widget').setAttribute('class', data.value)
  } else if (data.type === 'setWidth') {
    const width = data.value

    document.querySelector('#bp-widget').style.width = typeof width === 'number' ? width + 'px' : width
  }
})

function init(config) {
  const host = config.host || window.ROOT_PATH || ''
  const botId = config.botId || ''
  const cssHref = host + '/assets/modules/channel-web/inject.css'
  injectDOMElement('link', 'head', { rel: 'stylesheet', href: cssHref })
  const options = encodeURIComponent(JSON.stringify({ config: config }))
  let iframeSrc = host + '/lite/' + botId + '/?m=channel-web&v=Embedded&options=' + options
  if (config.ref) {
    iframeSrc += '&ref=' + encodeURIComponent(config.ref)
  }
  const title = config.botConvoDescription || config.botName || config.botId
  const iframeHTML =
    '<iframe id="bp-widget" title="' +
    encodeURIComponent(title) +
    '" frameborder="0" src="' +
    iframeSrc +
    '" class="bp-widget-web"/>'
  injectDOMElement('div', 'body', { id: 'bp-web-widget', innerHTML: iframeHTML })

  const iframeWindow = document.querySelector('#bp-web-widget > #bp-widget').contentWindow
  function configure(payload) {
    iframeWindow.postMessage({ action: 'configure', payload: payload }, '*')
  }
  function sendEvent(payload) {
    iframeWindow.postMessage({ action: 'event', payload: payload }, '*')
  }
  function mergeConfig(payload) {
    iframeWindow.postMessage({ action: 'mergeConfig', payload: payload }, '*')
  }

  window.botpressWebChat.configure = configure
  window.botpressWebChat.sendEvent = sendEvent
  window.botpressWebChat.mergeConfig = mergeConfig
}

// Do we want to expose 'onPostback'
// Or do we let it as is (window listens on message) ?
window.botpressWebChat = { init: init }
