const injectDOMElement = (tagName, targetSelector, options = {}) => {
  const element = document.createElement(tagName)
  Object.keys(options).forEach(key => (element[key] = options[key]))
  document.querySelector(targetSelector).appendChild(element)
  return element
}

window.addEventListener('message', ({ data }) => {
  if (!data || !data.type || data.type !== 'setClass') {
    return
  }
  document.querySelector('#bp-widget').setAttribute('class', data.value)
})

const init = ({ host = '', hideWidget = false, ...config }) => {
  const cssHref = `${host}/api/botpress-platform-webchat/inject.css`
  injectDOMElement('link', 'head', { rel: 'stylesheet', href: cssHref })

  const options = encodeURIComponent(JSON.stringify({ hideWidget, config }))
  const iframeSrc = `${host}/lite/?m=channel-web&v=embedded&options=${options}`
  const iframeHTML = `<iframe id='bp-widget' frameborder='0' src='${iframeSrc}' />`
  injectDOMElement('div', 'body', { id: 'bp-web-widget', innerHTML: iframeHTML })

  const iframeWindow = document.querySelector('#bp-web-widget > #bp-widget').contentWindow
  const configure = payload => iframeWindow.postMessage({ action: 'configure', payload }, '*')
  const sendEvent = payload => iframeWindow.postMessage({ action: 'event', payload }, '*')

  window.botpressWebChat = { ...window.botpressWebChat, configure, sendEvent }
}

window.botpressWebChat = { init }
