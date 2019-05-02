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

function toDate(argument) {
  var argStr = Object.prototype.toString.call(argument)

  // Clone the date
  if (argument instanceof Date || (typeof argument === 'object' && argStr === '[object Date]')) {
    // Prevent the date to lose the milliseconds when passed to new Date() in IE10
    return new Date(argument.getTime())
  } else if (typeof argument === 'number' || argStr === '[object Number]') {
    return new Date(argument)
  } else {
    if ((typeof argument === 'string' || argStr === '[object String]') && typeof console !== 'undefined') {
      console.warn('Please use `parseISO` to parse strings')
      console.warn(new Error().stack)
    }
    return new Date(NaN)
  }
}

export const differenceInMinutes = (dirtyDateLeft, dirtyDateRight) => {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
  }

  var diff = (toDate(dirtyDateLeft).getTime() - toDate(dirtyDateRight).getTime()) / 60000
  return diff > 0 ? Math.floor(diff) : Math.ceil(diff)
}

export const addMilliseconds = (dirtyDate, dirtyAmount) => {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
  }

  function toInteger(dirtyNumber) {
    var number = Number(dirtyNumber)
    return number < 0 ? Math.ceil(number) : Math.floor(number)
  }

  var timestamp = toDate(dirtyDate).getTime()
  var amount = toInteger(dirtyAmount)
  return new Date(timestamp + amount)
}

export const isBefore = (dirtyDate, dirtyDateToCompare) => {
  if (arguments.length < 2) {
    throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
  }

  var date = toDate(dirtyDate)
  var dateToCompare = toDate(dirtyDateToCompare)
  return date.getTime() < dateToCompare.getTime()
}
