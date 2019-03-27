const asyncDebounce = async timeMs => {
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

export default asyncDebounce
