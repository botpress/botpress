import MarkdownIt from 'markdown-it'
// @ts-ignore
import MarkdownItSub from 'markdown-it-sub'
// @ts-ignore
import MarkdownItSup from 'markdown-it-sup'
import { TwilioChannel } from './types'

const md = MarkdownIt({
  html: false,
  xhtmlOut: false,
  breaks: false,
})
  .disable(['table', 'list', 'hr', 'link'])
  .use(MarkdownItSub)
  .use(MarkdownItSup)

export const parseMarkdown = (markdown: string, channel: TwilioChannel): string => {
  switch (channel) {
    case 'messenger':
      return _markdownToMessenger(markdown)
    case 'whatsapp':
      return _markdownToWhatsApp(markdown)
    case 'rcs':
      return _markdownToPlainText(markdown)
    case 'sms/mms':
      return _markdownToPlainText(markdown)
    default:
      channel satisfies never
      return _markdownToPlainText(markdown)
  }
}

const _markdownToPlainText = (markdown: string): string => {
  return _removeEmptyLinesFromText(_removeHTMLTags(_extractImagesUrl(md.render(markdown)))).trim()
}

const _markdownToMessenger = (markdown: string): string => {
  return _removeEmptyLinesFromText(
    _removeHTMLTags(_extractUrl(_extractImagesUrl(_changeMessengerSpecificTags(md.render(markdown)))))
  ).trim()
}

const _markdownToWhatsApp = (markdown: string): string => {
  return _removeEmptyLinesFromText(
    _removeHTMLTags(_extractUrl(_extractImagesUrl(_changeWhatsAppSpecificTags(md.render(markdown)))))
  ).trim()
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
