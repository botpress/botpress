import {
  Blockquote,
  Code,
  Delete,
  Emphasis,
  FootnoteDefinition,
  FootnoteReference,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  Root,
  RootContent,
  Strong,
  Table,
  TableCell,
  Text,
} from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { TwilioChannel } from './types'

const FIXED_SIZE_SPACE_CHAR = '\u2002' // 'En space' yields better results for identation in WhatsApp messages
type NodeHandler = (
  node: RootContent,
  visit: (node: RootNodes) => string,
  parents: RootNodes[],
  handlers: MarkdownHandlers
) => string

type MarkdownHandlers = {
  blockquote?: NodeHandler
  break?: NodeHandler
  code?: NodeHandler
  delete?: NodeHandler
  emphasis?: NodeHandler
  footnoteDefinition?: NodeHandler
  footnoteReference?: NodeHandler
  heading?: NodeHandler
  html?: NodeHandler
  image?: NodeHandler
  inlineCode?: NodeHandler
  link?: NodeHandler
  list?: NodeHandler
  paragraph?: NodeHandler
  strong?: NodeHandler
  table?: NodeHandler
  text?: NodeHandler
  thematicBreak?: NodeHandler
}

const stripAllHandlers: MarkdownHandlers = {
  blockquote: (node, visit) => `Quote: “${visit(node as Blockquote)}”\n`,
  break: (_node, _visit) => '\n',
  code: (node, _visit) => `${(node as Code).value}\n`,
  delete: (node, visit) => `${visit(node as Delete)}`,
  emphasis: (node, visit) => visit(node as Emphasis),
  footnoteDefinition: (node, visit) =>
    `[${(node as FootnoteDefinition).identifier}] ${visit(node as FootnoteDefinition)}\n`,
  footnoteReference: (node, _visit) => `[${(node as FootnoteReference).identifier}]`,
  heading: (node, visit) => `${visit(node as Heading)}\n`,
  html: (_node, _visit) => '',
  image: (node, _visit) => (node as Image).url,
  inlineCode: (node, _visit) => (node as InlineCode).value,
  link: (node, _visit) => (node as Link).url,
  list: (node, _visit, parents, handlers) => _handleList(node as List, handlers, parents),
  paragraph: (node, visit, parents) => `${visit(node as Paragraph)}${parents.at(-1)?.type === 'root' ? '\n' : ''}`,
  strong: (node, visit) => visit(node as Strong),
  table: (node, _visit, parents, handlers) => _handleTable(node as Table, handlers, parents),
  text: (node, _visit) => (node as Text).value,
  thematicBreak: (_node, _visit) => '---\n',
}

const messengerHandlers: MarkdownHandlers = {
  ...stripAllHandlers,
  code: (node, _visit) => `\`\`\`\n${(node as Code).value}\n\`\`\`\n`,
  delete: (node, visit) => `~${visit(node as Delete)}~`,
  emphasis: (node, visit) => `_${visit(node as Emphasis)}_`,
  inlineCode: (node, _visit) => `\`${(node as InlineCode).value}\``,
  strong: (node, visit) => `*${visit(node as Strong)}*`,
}

const whatsappHandlers: MarkdownHandlers = {
  ...stripAllHandlers,
  code: (node, _visit) => `\`\`\`${(node as Code).value}\`\`\`\n`,
  delete: (node, visit) => `~${visit(node as Delete)}~`,
  emphasis: (node, visit) => `_${visit(node as Emphasis)}_`,
  inlineCode: (node, _visit) => `\`${(node as InlineCode).value}\``,
  strong: (node, visit) => `*${visit(node as Strong)}*`,
}

type RootNodes =
  | Blockquote
  | Delete
  | Emphasis
  | FootnoteDefinition
  | Heading
  | List
  | ListItem
  | Paragraph
  | Root
  | Strong
  | Table
  | TableCell
// const _visitTree = (tree: Parent): string => {
const _visitTree = (tree: RootNodes, handlers: MarkdownHandlers, parents: RootNodes[]): string => {
  let tmp = ''
  let footnoteTmp = ''
  parents.push(tree)
  for (const node of tree.children) {
    console.log('node:', node, '\n=====================')
    const handler = handlers[node.type as keyof MarkdownHandlers]
    if (handler === undefined) {
      throw new Error('unhandledError')
    }
    if (node.type === 'footnoteDefinition') {
      footnoteTmp += handler(node, (n) => _visitTree(n, handlers, parents), parents, handlers)
      continue
    }
    tmp += handler(node, (n) => _visitTree(n, handlers, parents), parents, handlers)
    console.log('tmp:', tmp)
  }
  parents.pop()
  return `${tmp}${footnoteTmp}`
}

const _handleList = (listNode: List, handlers: MarkdownHandlers, parents: RootNodes[]): string => {
  parents.push(listNode)
  const listLevel = parents.filter((parent) => parent.type === 'list').length
  console.log('parents:', parents, 'listLevel:', listLevel)
  let listTmp = listLevel !== 1 ? '\n' : ''
  let itemCount = 0
  for (const listItemNode of listNode.children) {
    itemCount++
    console.log('listItemNode:', listItemNode, '\n=====================')
    let prefix = FIXED_SIZE_SPACE_CHAR.repeat(listLevel - 1)
    if (listItemNode.checked !== undefined && listItemNode.checked !== null) {
      prefix += listItemNode.checked ? '☑︎ ' : '☐ '
    } else {
      prefix += listNode.ordered ? `${itemCount}. ` : '- '
    }
    const shouldBreak = listLevel === 1 || itemCount !== listNode.children.length
    console.log(
      '####################### itemCount:',
      itemCount,
      'length:',
      listNode.children.length,
      'listLevel',
      listLevel,
      'shouldBreak:',
      shouldBreak
    )
    listTmp = `${listTmp}${prefix}${_visitTree(listItemNode, handlers, parents)}${shouldBreak ? '\n' : ''}`
  }
  parents.pop()
  return listTmp
}

const _handleTable = (tableNode: Table, handlers: MarkdownHandlers, parents: RootNodes[]): string => {
  parents.push(tableNode)
  let tmpTable = ''
  for (const tableRow of tableNode.children) {
    console.log('tableRowNode:', tableRow, '\n=====================')
    let childrenCount = 0
    let tmpRow = '| '
    for (const tableCell of tableRow.children) {
      console.log('tableCellNode:', tableCell, '\n=====================')
      tmpRow = `${tmpRow}${_visitTree(tableCell, handlers, parents)}${childrenCount + 1 === tableRow.children.length ? ' |' : ' | '}`
      childrenCount++
    }
    tmpTable = `${tmpTable}${tmpRow}\n`
  }
  parents.pop()
  return tmpTable
}

export const parseMarkdown = (markdown: string, channel: TwilioChannel): string => {
  const tree = remark().use(remarkGfm).parse(markdown)
  console.log('tree:', tree, '\n=====================')
  switch (channel) {
    case 'messenger':
      return _visitTree(tree, messengerHandlers, [])
    case 'whatsapp':
      return _visitTree(tree, whatsappHandlers, [])
    case 'rcs':
      return _visitTree(tree, stripAllHandlers, [])
    case 'sms/mms':
      return _visitTree(tree, stripAllHandlers, [])
    default:
      channel satisfies never
      return _visitTree(tree, stripAllHandlers, [])
  }
}
