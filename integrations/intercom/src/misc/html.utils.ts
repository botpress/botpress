export type HtmlTag = 'p' | 'b' | 'h1' | 'h2' | 'ul' | 'ol' | 'li' | 'pre' | 'code' | 'i' | 'em' | 'strong'

export function stripTags(str: string) {
  return str.replace(/<[^>]*>?/gm, '')
}

export function ol(str: string) {
  return addHtmlTag(str, 'ol')
}

export function li(str: string) {
  return addHtmlTag(str, 'li')
}

export function ul(str: string) {
  return addHtmlTag(str, 'ul')
}

export function p(str: string) {
  return addHtmlTag(str, 'p')
}

export function b(str: string) {
  return addHtmlTag(str, 'b')
}

export function h1(str: string) {
  return addHtmlTag(str, 'h1')
}

export function h2(str: string) {
  return addHtmlTag(str, 'h2')
}

export function img(src: string) {
  return `<img src="${src}" />`
}

export function a(href: string, text: string) {
  return `<a href="${href}">${text}</a>`
}

function addHtmlTag(str: string, tag: HtmlTag) {
  return `<${tag}>${str}</${tag}>`
}
