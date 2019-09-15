export const getOverridedComponent = (overrides, componentName) => {
  if (overrides && overrides[componentName]) {
    const { module, component } = overrides[componentName]
    if (module && component) {
      return window.botpress[module][component]
    }
  }
}

export const asyncDebounce = async timeMs => {
  let lastClickInMs = undefined

  const debounce = promise => {
    const now = Date.now()
    if (!lastClickInMs) {
      lastClickInMs = now
    }

    if (now - lastClickInMs > timeMs) {
      lastClickInMs = now
      return promise
    }
  }
}

export const downloadFile = (name, blob) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', name)

  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const checkLocationOrigin = () => {
  if (!window.location.origin) {
    const { protocol, hostname, port } = window.location
    // @ts-ignore
    window.location.origin = `${protocol}//${hostname}${port && ':' + port}`
  }
}

export const initializeAnalytics = () => {
  if (window.botpressWebChat && window.botpressWebChat.sendUsageStats) {
    try {
      // @ts-ignore
      ReactGA.initialize('UA-90044826-2')
      // @ts-ignore
      ReactGA.event({ category: 'WebChat', action: 'render', nonInteraction: true })
    } catch (err) {
      console.log('Error init analytics', err)
    }
  }
}
