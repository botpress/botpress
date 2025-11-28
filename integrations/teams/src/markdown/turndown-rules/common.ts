export const isElementOfType = <K extends keyof HTMLElementTagNameMap>(
  el: Element,
  tagName: K
): el is HTMLElementTagNameMap[K] => {
  return el.tagName.toLowerCase() === tagName.toLowerCase()
}
