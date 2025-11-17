import { List, Node, Table } from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { MarkdownHandlers, NodeHandler, RootNodes } from './types'

export const stripAllHandlers: MarkdownHandlers = {
  blockquote: (node, visit) => `Quote: “${visit(node)}”\n`,
  break: (_node, _visit) => '\n',
  code: (node, _visit) => `${node.value}\n`,
  delete: (node, visit) => `${visit(node)}`,
  emphasis: (node, visit) => visit(node),
  footnoteDefinition: (node, visit) => `[${node.identifier}] ${visit(node)}\n`,
  footnoteReference: (node, _visit) => `[${node.identifier}]`,
  heading: (node, visit) => `${visit(node)}\n`,
  html: (_node, _visit) => '',
  image: (node, _visit) => node.url,
  inlineCode: (node, _visit) => node.value,
  link: (node, _visit) => node.url,
  list: (node, _visit, parents, handlers) => handleList(node, handlers, parents),
  paragraph: (node, visit, parents) => `${visit(node)}${parents.at(-1)?.type === 'root' ? '\n' : ''}`,
  strong: (node, visit) => visit(node),
  table: (node, _visit, parents, handlers) => handleTable(node, handlers, parents),
  text: (node, _visit) => node.value,
  thematicBreak: (_node, _visit) => '---\n',
}

const FIXED_SIZE_SPACE_CHAR = '\u2002' // 'En space' yields better results for identation in WhatsApp messages

export const handleList = (listNode: List, handlers: MarkdownHandlers, parents: RootNodes[]): string => {
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
    listTmp = `${listTmp}${prefix}${visitTree(listItemNode, handlers, parents)}${shouldBreak ? '\n' : ''}`
  }
  parents.pop()
  return listTmp
}

export const handleTable = (tableNode: Table, handlers: MarkdownHandlers, parents: RootNodes[]): string => {
  parents.push(tableNode)
  let tmpTable = ''
  for (const tableRow of tableNode.children) {
    let childrenCount = 0
    let tmpRow = '| '
    for (const tableCell of tableRow.children) {
      tmpRow = `${tmpRow}${visitTree(tableCell, handlers, parents)}${childrenCount + 1 === tableRow.children.length ? ' |' : ' | '}`
      childrenCount++
    }
    tmpTable = `${tmpTable}${tmpRow}\n`
  }
  parents.pop()
  return tmpTable
}

const isNodeType = (s: string, handlers: MarkdownHandlers): s is keyof MarkdownHandlers => s in handlers

export const visitTree = (tree: RootNodes, handlers: MarkdownHandlers, parents: RootNodes[]): string => {
  let tmp = ''
  let footnoteTmp = ''
  parents.push(tree)
  for (const node of tree.children) {
    if (!isNodeType(node.type, handlers)) {
      throw new Error(`The Markdown node type [${node.type}] is not supported`)
    }

    const handler = handlers[node.type] as NodeHandler<Node>

    if (node.type === 'footnoteDefinition') {
      footnoteTmp += handler(node, (n) => visitTree(n, handlers, parents), parents, handlers)
      continue
    }
    tmp += handler(node, (n) => visitTree(n, handlers, parents), parents, handlers)
  }
  parents.pop()
  return `${tmp}${footnoteTmp}`
}

export const transformMarkdown = (markdown: string, handlers: MarkdownHandlers = stripAllHandlers): string => {
  const tree = remark().use(remarkGfm).parse(markdown)
  return visitTree(tree, handlers, [])
}
