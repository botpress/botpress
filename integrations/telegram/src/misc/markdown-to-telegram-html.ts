import MarkdownIt from 'markdown-it'
import { nanoid } from 'nanoid'
import sanitizeHtml from 'sanitize-html'
import { spliceText } from './string-utils'

const sanitizerConfig: sanitizeHtml.IOptions = {
  allowedTags: ['strong', 'b', 'em', 'i', 's', 'del', 'code', 'pre', 'blockquote', 'a', 'img'],
  allowedAttributes: {
    a: ['href', 'title'],
    code: ['class'],
    img: ['src', 'srcset', 'alt', 'title'],
  },
}

const md = MarkdownIt({
  xhtmlOut: true,
  linkify: true,
  breaks: false,
  typographer: true,
}).disable(['table', 'list'])

type RawImageData = {
  marker: string
  src: string
  alt: string
  title?: string
}

type ImageData = {
  src: string
  alt: string
  title?: string
  pos: number
}

type RawExtractedData = Partial<{
  images: RawImageData[]
}>

type ExtractedData = Partial<{
  images: ImageData[]
}>

function ruleHandler(
  handler: (
    token: MarkdownIt.Token,
    env: RawExtractedData,
    tokens: MarkdownIt.Token[],
    idx: number,
    options: MarkdownIt.Options
  ) => string
) {
  return (tokens: MarkdownIt.Token[], idx: number, options: MarkdownIt.Options, env: RawExtractedData) => {
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

md.renderer.rules.image = ruleHandler((token: MarkdownIt.Token, env: RawExtractedData) => {
  const src = token?.attrGet('src')?.trim() ?? ''
  const alt = token?.content ?? ''
  const title = token?.attrGet('title')?.trim() ?? ''

  if (src.length > 0) {
    if (!env.images) env.images = []

    const marker = `<img-marker id="${nanoid()}" />`
    const imageData: RawImageData = { marker, src, alt }
    if (title.length > 0) imageData.title = title

    env.images.push(imageData)

    return marker
  }

  return ''
})

const _extractImagePositions = (
  html: string,
  extractedImages: RawImageData[]
): { html: string; images: ImageData[] } => {
  if (extractedImages.length === 0) return { html, images: [] }

  const images = extractedImages.map(({ marker, ...image }): ImageData => {
    const pos = html.indexOf(marker)
    if (pos === -1) {
      // This should never be thrown, if it does, it's a bug
      throw new Error('Image marker not found')
    }

    html = spliceText(html, pos, pos + marker.length, '')

    return {
      ...image,
      pos,
    }
  })

  return {
    html,
    images,
  }
}

export type MarkdownToTelegramHtmlResult = {
  html: string
  extractedData: ExtractedData
}
export function stdMarkdownToTelegramHtml(markdown: string): MarkdownToTelegramHtmlResult {
  const rawExtractedData: RawExtractedData = {}
  let telegramHtml = md
    .render(markdown, rawExtractedData)
    .trim()
    // .replace(/\|\|([^|]([^\n\r]*[^|\n\r])?)\|\|/g, "<tg-spoiler>$1</tg-spoiler>") // Telegram Spoilers will be implemented in a later version
    .replace(/<br\s?\/?>/g, '\n')

  const extractedData: ExtractedData = {}
  if (rawExtractedData.images) {
    const { html, images } = _extractImagePositions(telegramHtml, rawExtractedData.images)
    telegramHtml = html

    if (images.length > 0) {
      extractedData.images = images
    }
  }

  return {
    html: sanitizeHtml(telegramHtml, sanitizerConfig),
    extractedData,
  }
}

function _splitAtIndices(value: string, indices: number[]) {
  const reversedSegments: string[] = []
  let remainder = value

  for (let i = indices.length - 1; i >= 0; i--) {
    const splitPos = indices[i]
    const segment = remainder.slice(splitPos)
    remainder = remainder.slice(0, splitPos)
    reversedSegments.push(segment)
  }

  reversedSegments.push(remainder)

  return reversedSegments.reverse()
}

export type MixedPayloads = ({ type: 'text'; text: string } | { type: 'image'; imageUrl: string })[]
export function markdownHtmlToTelegramPayloads(html: string, images: ImageData[]): MixedPayloads {
  const imageIndices = images.map((image) => image.pos)
  const htmlParts = _splitAtIndices(html, imageIndices)

  return htmlParts.reduce((payloads: MixedPayloads, htmlPart: string, index: number) => {
    if (htmlPart.trim().length > 0) {
      payloads.push({ type: 'text', text: htmlPart })
    }
    const image = images[index]
    if (image) {
      payloads.push({ type: 'image', imageUrl: image.src })
    }

    return payloads
  }, [])
}
