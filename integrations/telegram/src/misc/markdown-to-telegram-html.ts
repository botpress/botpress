import MarkdownIt from 'markdown-it'

const md = MarkdownIt({
  xhtmlOut: true,
  linkify: true,
  breaks: false,
  typographer: true,
}).disable(['table', 'list'])

type ExtractedData = Partial<{
  images: { src: string; alt: string }[]
}>

md.renderer.rules.paragraph_open = () => '\n'
md.renderer.rules.paragraph_close = () => '\n'

md.renderer.rules.image = (tokens, idx, _, env: ExtractedData) => {
  const token = tokens[idx]
  const src = token?.attrGet('src')?.trim() ?? ''
  const alt = token?.content ?? ''

  if (src.length > 0) {
    if (!env.images) env.images = []
    env.images.push({ src, alt })
  }

  return ''
}

export type MarkdownToTelegramHtmlResult = {
  html: string
  extractedData: ExtractedData
}
export function stdMarkdownToTelegramHtml(markdown: string): MarkdownToTelegramHtmlResult {
  const extractedData: ExtractedData = {}
  const telegramHtml = md
    .render(markdown, extractedData)
    .trim()
    // .replace(/\|\|([^|]([^\n\r]*[^|\n\r])?)\|\|/g, "<tg-spoiler>$1</tg-spoiler>") // Telegram Spoilers will be implemented in a later version
    .replace(/<br\s?\/?>/g, '\n')
  return { html: telegramHtml, extractedData }
}
