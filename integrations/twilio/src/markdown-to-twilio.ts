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

type NodeHandler = (node: RootContent, visit: (node: RootNodes) => string, parentType?: string) => string

type MarkdownHandlers = {
  blockquote?: NodeHandler
  break?: NodeHandler
  code?: NodeHandler
  delete?: NodeHandler
  emphasis?: NodeHandler
  footnoteDefinition?: NodeHandler
  footnoteReference?: NodeHandler
  heading?: NodeHandler
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
  image: (node, _visit) => (node as Image).url,
  inlineCode: (node, _visit) => (node as InlineCode).value,
  link: (node, _visit) => (node as Link).url,
  // TODO handle handlers properly
  list: (node, _visit) => _handleList(node as List, stripAllHandlers),
  paragraph: (node, visit, parentType) => `${visit(node as Paragraph)}${parentType === 'root' ? '\n' : ''}`,
  strong: (node, visit) => visit(node as Strong),
  // TODO handle handlers properly
  table: (node, _visit) => _handleTable(node as Table, stripAllHandlers),
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
const _visitTree = (tree: RootNodes, handlers: MarkdownHandlers): string => {
  let tmp = ''
  let footnoteTmp = ''
  const parentType = tree.type
  for (const node of tree.children) {
    console.log('node:', node, '\n=====================')
    const handler = handlers[node.type as keyof MarkdownHandlers]
    if (handler === undefined) {
      throw new Error('unhandledError')
    }
    if (node.type === 'footnoteDefinition') {
      footnoteTmp += handler(node, (n) => _visitTree(n, handlers), parentType)
      continue
    }
    tmp += handler(node, (n) => _visitTree(n, handlers), parentType)
  }
  return `${tmp}${footnoteTmp}`
}

const _handleList = (listNode: List, handlers: MarkdownHandlers): string => {
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
    listTmp = `${listTmp}${prefix}${_visitTree(listItemNode, handlers)}\n`
  }
  return listTmp
}

const _handleTable = (tableNode: Table, handlers: MarkdownHandlers): string => {
  let tmpTable = ''
  for (const tableRow of tableNode.children) {
    console.log('tableRowNode:', tableRow, '\n=====================')
    let childrenCount = 0
    let tmpRow = '| '
    for (const tableCell of tableRow.children) {
      console.log('tableCellNode:', tableCell, '\n=====================')
      tmpRow = `${tmpRow}${_visitTree(tableCell, handlers)}${childrenCount + 1 === tableRow.children.length ? ' |' : ' | '}`
      childrenCount++
    }
    tmpTable = `${tmpTable}${tmpRow}\n`
  }
  return tmpTable
}

export const parseMarkdown = (markdown: string, channel: TwilioChannel): string => {
  const tree = remark().use(remarkGfm).parse(markdown)
  switch (channel) {
    case 'messenger':
      return _visitTree(tree, messengerHandlers)
    case 'whatsapp':
      return _visitTree(tree, whatsappHandlers)
    case 'rcs':
      return _visitTree(tree, stripAllHandlers)
    case 'sms/mms':
      return _visitTree(tree, stripAllHandlers)
    default:
      channel satisfies never
      return _visitTree(tree, stripAllHandlers)
  }
}
