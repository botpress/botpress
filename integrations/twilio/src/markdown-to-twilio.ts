import MarkdownIt from 'markdown-it'
// @ts-ignore
import MarkdownItSub from 'markdown-it-sub'
// @ts-ignore
import MarkdownItSup from 'markdown-it-sup'
import {
  Blockquote,
  Delete,
  Emphasis,
  FootnoteDefinition,
  Heading,
  List,
  ListItem,
  Paragraph,
  Root,
  Strong,
  Table,
  TableCell,
} from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { TwilioChannel } from './types'

const _stripAllMarkdown = (markdown: string): string => {
  const tree = remark().use(remarkGfm).parse(markdown)
  console.log('tree:', tree, '\n=====================')
  const ans = _visitTree(tree)
  return ans
}

type RootNodes =
  | Root
  | Heading
  | Paragraph
  | List
  | ListItem
  | Strong
  | Emphasis
  | Blockquote
  | Delete
  | Table
  | TableCell
  | FootnoteDefinition
// const _visitTree = (tree: Parent): string => {
const _visitTree = (tree: RootNodes): string => {
  let tmp = ''
  let footnoteTmp = ''
  const isRoot = tree.type === 'root'
  for (const node of tree.children) {
    console.log('node:', node, '\n=====================')
    switch (node.type) {
      case 'blockquote':
        tmp = `${tmp}Quote: “${_visitTree(node)}”\n`
        break
      case 'break':
        tmp = `${tmp}\n`
        break
      case 'code':
        tmp = `${tmp}${node.value}\n`
        break
      case 'delete':
        tmp = `${tmp}${_visitTree(node)}`
        break
      case 'emphasis':
        tmp = `${tmp}${_visitTree(node)}`
        break
      case 'footnoteDefinition':
        footnoteTmp = `${footnoteTmp}[${node.identifier}] ${_visitTree(node)}\n`
        break
      case 'footnoteReference':
        tmp = `${tmp}[${node.identifier}]`
        break
      case 'heading':
        tmp = `${tmp}${_visitTree(node)}\n`
        break
      case 'image':
        tmp = `${tmp}${node.url}`
        break
      case 'inlineCode':
        tmp = `${tmp}${node.value}`
        break
      case 'link':
        tmp = `${tmp}${node.url}`
        break
      case 'list':
        tmp = `${tmp}${_handleList(node)}`
        break
      case 'paragraph':
        tmp = `${tmp}${_visitTree(node)}${isRoot ? '\n' : ''}`
        break
      case 'strong':
        tmp = `${tmp}${_visitTree(node)}`
        break
      case 'table':
        tmp = `${tmp}${_handleTable(node)}`
        break
      case 'text':
        tmp = `${tmp}${node.value}`
        break
      case 'thematicBreak':
        tmp = `${tmp}---\n`
        break
      default:
        console.error('unhandledError')
    }
  }
  return `${tmp}${footnoteTmp}`
}

const _handleList = (listNode: List): string => {
  let listTmp = ''
  let itemCount = 0
  for (const listItemNode of listNode.children) {
    console.log('listItemNode:', listItemNode, '\n=====================')
    let prefix = ''
    if (listItemNode.checked !== undefined && listItemNode.checked !== null) {
      prefix = listItemNode.checked ? '☑︎ ' : '☐ '
    } else {
      prefix = listNode.ordered ? `${++itemCount}. ` : '- '
    }
    listTmp = `${listTmp}${prefix}${_visitTree(listItemNode)}\n`
  }
  return listTmp
}

const _handleTable = (tableNode: Table): string => {
  let tmpTable = ''
  for (const tableRow of tableNode.children) {
    console.log('tableRowNode:', tableRow, '\n=====================')
    let childrenCount = 0
    let tmpRow = '| '
    for (const tableCell of tableRow.children) {
      console.log('tableCellNode:', tableCell, '\n=====================')
      tmpRow = `${tmpRow}${_visitTree(tableCell)}${childrenCount + 1 === tableRow.children.length ? ' |' : ' | '}`
      childrenCount++
    }
    tmpTable = `${tmpTable}${tmpRow}\n`
  }
  return tmpTable
}

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
      return _stripAllMarkdown(markdown)
    case 'sms/mms':
      return _stripAllMarkdown(markdown)
    default:
      channel satisfies never
      return _stripAllMarkdown(markdown)
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
