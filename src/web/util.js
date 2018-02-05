import _ from 'lodash'

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
