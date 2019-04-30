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
