import { marked, Token as MarkedToken, MarkedToken as MarkedDiscriminatedToken, Tokens as MarkedTokens } from 'marked'

const supportedMarkedInlineTokenTypes = [
  'strong',
  'em',
  'def',
  'del',
  'codespan',
  'link',
  'image',
  'text',
  'escape',
  'br',
] as const
const supportedMarkdedBlockTokenTypes = [
  'paragraph',
  'heading',
  'list',
  'list_item',
  'code',
  'hr',
  'text',
  'space',
  'html',
  'blockquote',
  'table',
] as const
const supportedMarkedTokenTypes = [...supportedMarkedInlineTokenTypes, ...supportedMarkdedBlockTokenTypes] as const

type SupportedMarkedTokenTypes = (typeof supportedMarkedTokenTypes)[number]
type SupportedMarkedToken = Extract<MarkedToken, { type: SupportedMarkedTokenTypes }>
type GenericToken = MarkedTokens.Generic & {
  type: 'generic' // Use 'generic' for unsupported types to allow discrimination
  originalType: string // Store the original type for reference
}
type Token = SupportedMarkedToken | GenericToken

// Ensure token type literals are valid
type AssertExtends<_A extends B, B> = true
type _assertion = AssertExtends<SupportedMarkedTokenTypes, MarkedDiscriminatedToken['type']>

type RequireSome<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
type Context = {
  currentListDepth?: number
  currentQuoteDepth?: number
  inHeader?: boolean
}

const FIXED_SIZE_SPACE_CHAR = '\u2002' // 'En space' yields better results for identation in WhatsApp messages
const ALT_BULLET_SYMBOLS = ['•', '◦', '➤', '✦'] // WhatsApp doesn't support nested lists

/**
 * Converts standard markdown to WhatsApp-compatible formatting using AST parsing (See [reference](https://faq.whatsapp.com/539178204879377/?cms_platform=web&locale=en_US))
 *
 * @param markdown - Input string with standard markdown formatting
 * @returns String formatted for WhatsApp
 */
export function convertMarkdownToWhatsApp(markdown: string): string {
  const tokens = _convertMarkedTokensToTokens(marked.lexer(markdown))
  return _processTokens(tokens, {}).trimEnd()
}

function _processTokens(tokens: Token[], ctx: Context): string {
  return tokens.map((token) => _processToken(token, ctx)).join('')
}

function _processToken(token: Token, ctx: Context): string {
  switch (token.type) {
    case 'paragraph':
      return _processInlineTokens(_convertMarkedTokensToTokens(token.tokens), ctx) + '\n'

    case 'heading':
      // Convert headers to bold text
      const headingText = _processInlineTokens(_convertMarkedTokensToTokens(token.tokens), { ...ctx, inHeader: true })
      return `*${headingText}*\n\n`

    case 'blockquote':
      return (
        _processBlockQuote(token, {
          ...ctx,
          currentQuoteDepth: ctx.currentQuoteDepth ?? 0,
        }) + '\n'
      )

    case 'list':
      return (
        _processListToken(token, {
          ...ctx,
          currentListDepth: ctx.currentListDepth ?? 0,
        }) + '\n'
      )

    case 'list_item':
      return _processTokens(_convertMarkedTokensToTokens(token.tokens), ctx)

    case 'code':
      // Block code
      return `\`\`\`${token.text}\`\`\`\n`

    case 'hr':
      return '---\n'

    case 'text':
      return _processTextToken(token, ctx) + '\n'

    case 'space':
      return '\n'

    case 'html':
      // Strip HTML tags
      return _removeEmptyLinesFromText(token.text.replace(/<[^>]*>/g, '')) + '\n\n'

    case 'table':
      return token.raw

    default:
      // Handle any other token types by processing their tokens if they exist
      if ('tokens' in token && token.tokens) {
        // No support for nested unknown tokens, processing as inline
        _processInlineTokens(_convertMarkedTokensToTokens(token.tokens), ctx)
      }
      if ('text' in token) {
        return token.text
      }
      return ''
  }
}

function _processInlineTokens(tokens: Token[], ctx: Context): string {
  return tokens.map((token) => _processInlineToken(token, ctx)).join('')
}

function _processInlineToken(token: Token, ctx: Context): string {
  switch (token.type) {
    case 'strong':
      // Bold: **text** or __text__ -> *text*
      const boldText = _processInlineTokens(_convertMarkedTokensToTokens(token.tokens), ctx)
      return ctx.inHeader ? boldText : `*${boldText}*`

    case 'em':
      // Italic: *text* or _text_ -> _text_
      const italicText = _processInlineTokens(_convertMarkedTokensToTokens(token.tokens), ctx)
      return `_${italicText}_`

    case 'def':
      // Definition: [text]: url -> text (url)
      return `${token.title} (${token.href})`

    case 'del':
      // Strikethrough: ~~text~~ -> ~text~
      const strikeText = _processInlineTokens(_convertMarkedTokensToTokens(token.tokens), ctx)
      return `~${strikeText}~`

    case 'codespan':
      // Inline code: `text` -> `text`
      return `\`${token.text}\``

    case 'link':
      // Links: [text](url) -> text (url)
      const linkText = _processInlineTokens(_convertMarkedTokensToTokens(token.tokens), ctx)
      const isTrueAutolink = /^<.*>$/.test(token.raw)
      const isEmail = token.href.startsWith('mailto:')
      if (isEmail && !isTrueAutolink) {
        return linkText
      }
      return linkText !== token.href ? `${linkText} (${token.href})` : token.href

    case 'image':
      // Images: ![alt](url) -> Image: alt (url) or just url
      const altText = token.title || token.text
      return altText ? `Image: ${altText} (${token.href})` : token.href

    case 'text':
      return _processTextToken(token, ctx)

    case 'html':
      // Strip HTML tags
      return token.text.replace(/<[^>]*>/g, '')

    case 'escape':
      return token.text

    case 'br':
      return '\n'

    default:
      // Handle nested tokens
      if ('tokens' in token && token.tokens) {
        return _processInlineTokens(_convertMarkedTokensToTokens(token.tokens), ctx)
      }
      if ('text' in token) {
        return token.text
      }
      return ''
  }
}

function _processListToken(token: Token & { type: 'list' }, ctx: RequireSome<Context, 'currentListDepth'>): string {
  const items = token.items.map((item, index) => {
    const itemText = _processToken(item, { ...ctx, currentListDepth: ctx.currentListDepth + 1 })
    let prefix
    if (token.ordered) {
      prefix = `${index + 1}. `
    } else if (item.task) {
      prefix = item.checked ? '☑ ' : '☐ '
    } else {
      const symbol = ctx.currentListDepth ? ALT_BULLET_SYMBOLS[ctx.currentListDepth % ALT_BULLET_SYMBOLS.length] : '-'
      prefix = symbol + ' '
    }
    return prefix + itemText
  })

  let itemsText = items
    .map((item) => item.split('\n'))
    .flat()
    .filter(_isNonEmptyLine)
    .map((line) => `${ctx.currentListDepth ? FIXED_SIZE_SPACE_CHAR.repeat(2) : ''}${line}`)
    .join('\n')
  if (ctx.currentListDepth) {
    // Nested lists should start on next line
    itemsText = `\n${itemsText}`
  }
  return itemsText
}

function _processBlockQuote(
  token: Token & { type: 'blockquote' },
  ctx: RequireSome<Context, 'currentQuoteDepth'>
): string {
  const prefix = ctx.currentQuoteDepth ? '» ' : '> ' // WhatsApp doesn't support nested blockquotes
  const tokens = _convertMarkedTokensToTokens(token.tokens)
  return tokens
    .map((t) => _processToken(t, { ...ctx, currentQuoteDepth: ctx.currentQuoteDepth + 1 }))
    .map((text) => text.split('\n'))
    .flat()
    .filter(_isNonEmptyLine)
    .map((line) => prefix + line)
    .join('\n')
}

function _processTextToken(token: Token & { type: 'text' }, ctx: Context): string {
  // Process text tokens, which may contain inline formatting
  if (token.tokens) {
    return _processInlineTokens(_convertMarkedTokensToTokens(token.tokens), ctx)
  }
  return token.text
}

function _isSupportedMarkedToken(token: MarkedToken): token is SupportedMarkedToken {
  return (supportedMarkedTokenTypes as unknown as string[]).includes(token.type)
}
function _convertMarkedGenericTokenToGenericToken(token: MarkedTokens.Generic): GenericToken {
  return {
    ...token,
    type: 'generic',
    originalType: token.type,
  }
}

function _convertMarkedTokenToToken(token: MarkedToken): Token {
  if (_isSupportedMarkedToken(token)) {
    return token
  }
  return _convertMarkedGenericTokenToGenericToken(token)
}

function _convertMarkedTokensToTokens(tokens: MarkedToken[]): Token[] {
  return tokens.map(_convertMarkedTokenToToken)
}

function _isNonEmptyLine(line: string): boolean {
  return line.trim() !== ''
}

function _removeEmptyLinesFromText(text: string): string {
  return text.split('\n').filter(_isNonEmptyLine).join('\n')
}
