const DEFAULT_WEBCHAT_ID = 'iframeWindow'

function injectDOMElement(tagName, selector, options) {
  const element = document.createElement(tagName)
  if (options) {
    Object.keys(options).forEach(function(key) {
      element[key] = options[key]
    })
  }
  document.querySelector(selector).appendChild(element)
  return element
}

function generateIFrameHTML(host, config) {
  const botId = config.botId || ''
  const options = encodeURIComponent(JSON.stringify({ config: config }))
  let iframeSrc = host + '/lite/' + botId + '/?m=channel-web&v=Embedded&options=' + options
  if (config.ref) {
    iframeSrc += '&ref=' + encodeURIComponent(config.ref)
  }
  const title = config.botConvoDescription || config.botName || config.botId
  
  // should we remove bp-widget-web if className is provided ?
  const classesTag = 'bp-widget-web ' + ( config.className || '')
  return '<iframe id="bp-widget" title="' + encodeURIComponent(title) + '" frameborder="0" src="' + iframeSrc +'" class="'+ classesTag +'"/>'
}

const chatRefs = {}

// provides proper chat reference
function getChatRef(chatId){
  chatId = chatId || DEFAULT_WEBCHAT_ID
  const fakeChatRef = { 
    postMessage: function()  {console.warn('No webchat with id ' + chatId + ' has bneen initialized, \n please use window.botpressWebChat.init first.')}
  }
 
  return chatRefs[chatId] || fakeChatRef
}

function configure(payload, chatId) {
  const chatWindow = getChatRef(chatId)
  chatWindow.postMessage({ action: 'configure', payload: payload }, '*')
}
function sendEvent(payload, chatId) {
  const chatWindow = getChatRef(chatId)
  chatWindow.postMessage({ action: 'event', payload: payload }, '*')
}
function mergeConfig(payload, chatId) {
  const chatWindow = getChatRef(chatId)
  chatWindow.postMessage({ action: 'mergeConfig', payload: payload }, '*')
}

function init(config) {
  const chatId = config.chatId || DEFAULT_WEBCHAT_ID
  const host = config.host || window.ROOT_PATH || ''
  
  const cssHref = host + '/assets/modules/channel-web/inject.css'
  injectDOMElement('link', 'head', { rel: 'stylesheet', href: cssHref })
  
  const iframeHTML = generateIFrameHTML(host, config)
  const targetSelector = config.targetSelector || 'body' 
  injectDOMElement('div', targetSelector, { id: chatId, innerHTML: iframeHTML })

  const iframeRef = document.querySelector('#' + chatId + ' > #bp-widget').contentWindow

  chatRefs[chatId] = iframeRef
  window.botpressWebChat.configure = configure
  window.botpressWebChat.sendEvent = sendEvent
  window.botpressWebChat.mergeConfig = mergeConfig
}

window.botpressWebChat = {
  init: init,
  configure: configure,
  sendEvent: sendEvent,
  mergeConfig: mergeConfig
}

window.addEventListener('message', function(payload) {
  const data = payload.data
  if (!data || !data.type) {
    return
  }

  const chatId = data.chatId || DEFAULT_WEBCHAT_ID
  const iframeSelector = '#' + chatId + ' #bp-widget'
  if (data.type === 'setClass') {
    document.querySelector(iframeSelector).setAttribute('class', data.value)
  } else if (data.type === 'setWidth') {
    const width = data.value

    document.querySelector(iframeSelector).style.width = typeof width === 'number' ? width + 'px' : width
  }
})