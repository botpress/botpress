import MarkdownIt from 'markdown-it'

const md = MarkdownIt({
  xhtmlOut: true,
  linkify: true,
  breaks: false,
  typographer: true,
}).disable(['table', 'list'])

type ImageData = {
  src: string
  alt: string
  title?: string
}

type ExtractedData = Partial<{
  images: ImageData[]
}>

function ruleHandler(
  handler: (
    token: MarkdownIt.Token,
    env: ExtractedData,
    tokens: MarkdownIt.Token[],
    idx: number,
    options: MarkdownIt.Options
  ) => string
) {
  return (tokens: MarkdownIt.Token[], idx: number, options: MarkdownIt.Options, env: ExtractedData) => {
    const token = tokens[idx]
    if (!token) throw new Error('Token not found')
    return handler(token, env, tokens, idx, options)
  }
}

const textReplacer = md.renderer.rules.text ?? ruleHandler((token) => md.utils.escapeHtml(token.content))

md.renderer.rules.paragraph_open = () => '\n'
md.renderer.rules.paragraph_close = () => '\n'
md.renderer.rules.heading_open = () => ''
md.renderer.rules.heading_close = () => '\n'
md.renderer.rules.hr = () => '\n'
md.renderer.rules.text = textReplacer

md.renderer.rules.link_open = ruleHandler((token: MarkdownIt.Token) => {
  const href = token.attrGet('href')?.trim() ?? ''

  // Just sends the email or the phone number as is since Telegram will be the one to convert it
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    md.renderer.rules.text = () => ''
    return href.replace(/mailto:|tel:/, '')
  }

  const formattedAttributes = token.attrs?.reduce(
    (formattedAttrs, [attrName, attrValue]) => `${formattedAttrs} ${attrName}="${attrValue}"`,
    ''
  )

  return `<${token.tag}${formattedAttributes ?? ''}>`
})

md.renderer.rules.link_close = ruleHandler((token: MarkdownIt.Token) => {
  if (md.renderer.rules.text !== textReplacer) {
    md.renderer.rules.text = textReplacer
    return ''
  }
  return `</${token.tag}>`
})

md.renderer.rules.image = ruleHandler((token: MarkdownIt.Token, env: ExtractedData) => {
  const src = token?.attrGet('src')?.trim() ?? ''
  const alt = token?.content ?? ''
  const title = token?.attrGet('title')?.trim() ?? ''

  if (src.length > 0) {
    if (!env.images) env.images = []

    const imageData: ImageData = { src, alt }
    if (title.length > 0) imageData.title = title

    env.images.push(imageData)
  }

  return ''
})

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
