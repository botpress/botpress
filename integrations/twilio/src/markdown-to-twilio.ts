import MarkdownIt from 'markdown-it'
// @ts-ignore
import MarkdownItSub from 'markdown-it-sub'
// @ts-ignore
import MarkdownItSup from 'markdown-it-sup'

const md = MarkdownIt({
  html: false,
  xhtmlOut: false,
  breaks: false,
})
  .disable(['table', 'list', 'hr', 'link'])
  .use(MarkdownItSub)
  .use(MarkdownItSup)

export const markdownToTwilio = (markdown: string): string => {
  return _removeEmptyLinesFromText(_removeHTMLTags(_extractImagesUrl(md.render(markdown)))).trim()
}

export const markdownToMessenger = (markdown: string): string => {
  const a = markdown
  const b = md.render(a)
  const c = _changeMessengerSpecificTags(b)
  const d = _extractImagesUrl(c)
  const e = _extractUrl(d)
  const f = _removeHTMLTags(e)
  const g = _removeEmptyLinesFromText(f)
  const h = g.trim()
  return h
}

export const markdownToWhatsApp = (markdown: string): string => {
  const a = markdown
  const b = md.render(a)
  const c = _changeWhatsAppSpecificTags(b)
  const d = _extractImagesUrl(c)
  const e = _extractUrl(d)
  const f = _removeHTMLTags(e)
  const g = _removeEmptyLinesFromText(f)
  const h = g.trim()
  return h
}

const _removeHTMLTags = (input: string): string => {
  return input.replace(/<[^>]*>/g, '')
}

const _extractUrl = (input: string): string => {
  return input.replace(/\[.*?\]\((https?:\/\/[^)]+)\)/g, '$1')
}

const _extractImagesUrl = (input: string): string => {
  return input.replace('<img src="', '').replace('" alt="image">', '')
}

const _removeEmptyLinesFromText = (input: string): string => {
  return input.split('\n').filter(_isNonEmptyLine).join('\n')
}

const _isNonEmptyLine = (line: string): boolean => {
  return line.trim() !== ''
}

// https://www.facebook.com/help/147348452522644
const _changeMessengerSpecificTags = (input: string): string => {
  const firstPass: Record<string, string> = {
    '<pre><code>': '```\n',
    '</code></pre>': '```',
  }
  const secondPass: Record<string, string> = {
    '<strong>': '*',
    '</strong>': '*',
    '<em>': '_',
    '</em>': '_',
    '<s>': '~',
    '</s>': '~',
    '<code>': '`',
    '</code>': '`',
  }

  let tmp: string
  tmp = _replaceTagsByValue(input, firstPass)
  tmp = _replaceTagsByValue(tmp, secondPass)
  return tmp
}

// https://faq.whatsapp.com/539178204879377
const _changeWhatsAppSpecificTags = (input: string): string => {
  const firstPass: Record<string, string> = {
    '<pre><code>': '```',
    '\n</code></pre>': '```',
  }
  const secondPass: Record<string, string> = {
    '<strong>': '*',
    '</strong>': '*',
    '<em>': '_',
    '</em>': '_',
    '<s>': '~',
    '</s>': '~',
    '<code>': '`',
    '</code>': '`',
    '<blockquote>\n<p>': '> ',
  }

  let tmp: string
  tmp = _replaceTagsByValue(input, firstPass)
  tmp = _replaceTagsByValue(tmp, secondPass)
  return tmp
}

const _replaceTagsByValue = (input: string, replaceRecord: Record<string, string>): string => {
  Object.keys(replaceRecord).forEach((replace) => {
    if (!replaceRecord[replace]) {
      return
    }
    input = input.replaceAll(replace, replaceRecord[replace])
  })
  return input
}
