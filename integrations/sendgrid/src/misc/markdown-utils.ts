import MarkdownIt from 'markdown-it'

const md = MarkdownIt({
  xhtmlOut: true,
  linkify: true,
  breaks: true,
  typographer: true,
}).disable('table')

export function markdownToHtml(markdown: string) {
  return md.render(markdown)
}
