import _ from 'lodash'
import generate from 'nanoid/generate'

export const hashCode = str => {
  let hash = 0
  if (str.length === 0) {
    return hash
  }

  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return hash
}

// https://davidwalsh.name/caret-end
export const moveCursorToEnd = el => {
  if (!el) {
    return
  }

  if (typeof el.selectionStart == 'number') {
    el.selectionStart = el.selectionEnd = el.value.length
    el.focus()
  } else if (typeof el.createTextRange != 'undefined') {
    el.focus()
    const range = el.createTextRange()
    range.collapse(false)
    range.select()
  }
}

export const prettyId = (length = 10) => generate('1234567890abcdef', length)

export const downloadBlob = (name, blob) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', name)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const parseBotId = () => {
  const botIdRegex = /^\/(studio|lite)\/(.+?)\//i
  let matches = window.location.pathname.match(botIdRegex)
  if (!matches || matches.length < 3 || !matches[1]) {
    matches = (window.BP_BASE_PATH + '/').match(botIdRegex)
  }
  return (matches && matches[2]) || ''
}
