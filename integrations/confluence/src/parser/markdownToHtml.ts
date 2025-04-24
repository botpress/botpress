import markdownit from 'markdown-it'

const md = markdownit()

export function convertMarkdownToHtml(markdown: string): string {
  return md.render(markdown)
}
