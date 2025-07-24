import MarkdownIt from 'markdown-it'

const md = MarkdownIt({
  xhtmlOut: true,
  linkify: true,
  breaks: true,
  typographer: true,
}).disable(['table', 'list'])

type ExtractedData = Partial<{
  images: { src: string; alt: string }[]
  codeBlocks: { type: 'start' | 'end'; pos: number }[]
}>

md.renderer.rules.paragraph_open = () => '\n'
md.renderer.rules.paragraph_close = () => '\n'
md.renderer.rules.hardbreak = () => '\n'
md.renderer.rules.softbreak = () => '\n'

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

export function stdMarkdownToTelegramHtml(markdown: string) {
  const extractedData: ExtractedData = {}
  const telegramHtml = md
    .render(markdown, extractedData)
    .trim()
    // .replace(/\|\|([^|]([^\n\r]*[^|\n\r])?)\|\|/g, "<tg-spoiler>$1</tg-spoiler>") // Telegram Spoilers will be implemented in a later version
    .replace(/<br\s?\/?>/g, '\n')
  return { html: telegramHtml, extractedData }
}
