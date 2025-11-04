import {
  Blockquote,
  Break,
  Code,
  Delete,
  Emphasis,
  FootnoteDefinition,
  FootnoteReference,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Node,
  Paragraph,
  Root,
  Strong,
  Table,
  TableCell,
  Text,
  ThematicBreak,
} from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'

const FIXED_SIZE_SPACE_CHAR = '\u2002' // 'En space' yields better results for identation in WhatsApp messages
type NodeHandler<N extends Node> = (
  node: N,
  visit: (node: RootNodes) => string,
  parents: RootNodes[],
  handlers: MarkdownHandlers
) => string

type MarkdownHandlers = {
  blockquote: NodeHandler<Blockquote>
  break: NodeHandler<Break>
  code: NodeHandler<Code>
  delete: NodeHandler<Delete>
  emphasis: NodeHandler<Emphasis>
  footnoteDefinition: NodeHandler<FootnoteDefinition>
  footnoteReference: NodeHandler<FootnoteReference>
  heading: NodeHandler<Heading>
  html: NodeHandler<Html>
  image: NodeHandler<Image>
  inlineCode: NodeHandler<InlineCode>
  link: NodeHandler<Link>
  list: NodeHandler<List>
  paragraph: NodeHandler<Paragraph>
  strong: NodeHandler<Strong>
  table: NodeHandler<Table>
  text: NodeHandler<Text>
  thematicBreak: NodeHandler<ThematicBreak>
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

const isNodeType = (s: string, handlers: MarkdownHandlers): s is keyof MarkdownHandlers => s in handlers

const _visitTree = (tree: RootNodes, handlers: MarkdownHandlers, parents: RootNodes[]): string => {
  let tmp = ''
  let footnoteTmp = ''
  parents.push(tree)
  for (const node of tree.children) {
    if (!isNodeType(node.type, handlers)) {
      throw new Error(`The Markdown node type [${node.type}] is not supported`)
    }

    const handler = handlers[node.type] as NodeHandler<Node>

    if (node.type === 'footnoteDefinition') {
      footnoteTmp += handler(node, (n) => _visitTree(n, handlers, parents), parents, handlers)
      continue
    }
    tmp += handler(node, (n) => _visitTree(n, handlers, parents), parents, handlers)
  }
  parents.pop()
  return `${tmp}${footnoteTmp}`
}

const _handleList = (listNode: List, handlers: MarkdownHandlers, parents: RootNodes[]): string => {
  parents.push(listNode)
  const listLevel = parents.filter((parent) => parent.type === 'list').length
  let listTmp = listLevel !== 1 ? '\n' : ''
  let itemCount = 0
  for (const listItemNode of listNode.children) {
    itemCount++
    let prefix = FIXED_SIZE_SPACE_CHAR.repeat(listLevel - 1)
    if (listItemNode.checked !== undefined && listItemNode.checked !== null) {
      prefix += listItemNode.checked ? '☑︎ ' : '☐ '
    } else {
      prefix += listNode.ordered ? `${itemCount}. ` : '- '
    }
    const shouldBreak = listLevel === 1 || itemCount !== listNode.children.length
    listTmp = `${listTmp}${prefix}${_visitTree(listItemNode, handlers, parents)}${shouldBreak ? '\n' : ''}`
  }
  parents.pop()
  return listTmp
}

const _handleTable = (tableNode: Table, handlers: MarkdownHandlers, parents: RootNodes[]): string => {
  parents.push(tableNode)
  let tmpTable = ''
  for (const tableRow of tableNode.children) {
    let childrenCount = 0
    let tmpRow = '| '
    for (const tableCell of tableRow.children) {
      tmpRow = `${tmpRow}${_visitTree(tableCell, handlers, parents)}${childrenCount + 1 === tableRow.children.length ? ' |' : ' | '}`
      childrenCount++
    }
    tmpTable = `${tmpTable}${tmpRow}\n`
  }
  parents.pop()
  return tmpTable
}

export const parseMarkdown = (markdown: string): string => {
  const tree = remark().use(remarkGfm).parse(markdown)
  return _visitTree(tree, stripAllHandlers, [])
}
