import { List, Parent, Root, Table } from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { ExtendedList, ExtendedListItem, ExtendedTableRow, MarkdownHandlers, NodeHandler } from './types'

/** 'En space' yields better results for indentation in WhatsApp messages */
const FIXED_SIZE_SPACE_CHAR = '\u2002'

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
  list: (node, visit) => {
    return `${node.listLevel !== 1 ? '\n' : ''}${visit(node)}`
  },
  listItem: (node, visit) => {
    const { itemCount, checked, ownerList } = node
    let prefix = FIXED_SIZE_SPACE_CHAR.repeat(ownerList.listLevel - 1)

    if (checked !== null) {
      prefix += checked ? '☑︎ ' : '☐ '
    } else {
      prefix += ownerList.ordered === true ? `${itemCount}. ` : '- '
    }

    const shouldBreak = ownerList.listLevel === 1 || itemCount < ownerList.children.length
    return `${prefix}${visit(node)}${shouldBreak ? '\n' : ''}`
  },
  paragraph: (node, visit, parents) => `${visit(node)}${parents.at(-1)?.type === 'root' ? '\n' : ''}`,
  strong: (node, visit) => visit(node),
  table: (node, visit) => visit(node),
  tableRow: (node, visit) => `${visit(node)}\n`,
  tableCell: (node, visit) => {
    const prefix = node.isFirst ? '| ' : ''
    const suffix = node.isLast ? ' |' : ' | '
    return `${prefix}${visit(node)}${suffix}`
  },
  text: (node, _visit) => node.value,
  thematicBreak: (_node, _visit) => '---\n',
}

const _applyListLevelAndItemIndices = (listNode: List, parents: Parent[]): ExtendedList => {
  const extendedList = listNode as ExtendedList

  const listLevel = parents.filter((parent) => parent.type === 'list').length + 1
  extendedList.listLevel = listLevel

  let index = 0
  for (const item of listNode.children) {
    index++
    const extendedItem = item as ExtendedListItem
    extendedItem.ownerList = extendedList
    extendedItem.itemCount = index
  }

  return extendedList
}

const _applyExtendedTableProps = (tableNode: Table): Table => {
  tableNode.children.forEach((row, index) => {
    const extendedRow = row as ExtendedTableRow
    const isHeaderRow = index === 0
    extendedRow.isHeader = isHeaderRow

    const numOfCells = extendedRow.children.length
    extendedRow.children.forEach((cell, index) => {
      cell.isHeader = isHeaderRow
      cell.isFirst = index === 0
      cell.isLast = index === numOfCells - 1
    })
  })

  return tableNode
}

const _isNodeType = (s: string, handlers: MarkdownHandlers): s is keyof MarkdownHandlers => s in handlers

export const visitTree = (
  tree: Parent,
  handlers: MarkdownHandlers,
  parents: Parent[],
  data: Record<string, unknown>
): string => {
  let tmp = ''
  let footnoteTmp = ''
  parents.push(tree)
  for (const node of tree.children) {
    if (!_isNodeType(node.type, handlers)) {
      throw new Error(`The Markdown node type [${node.type}] is not supported`)
    }

    const handler = handlers[node.type] as NodeHandler
    const visitHandler = (n: Parent) => visitTree(n, handlers, parents, data)

    switch (node.type) {
      case 'list':
        const listNode = _applyListLevelAndItemIndices(node, parents)
        tmp += handler(listNode, visitHandler, parents, handlers, data)
        break
      case 'listItem':
        node.checked = node.checked ?? null
        tmp += handler(node, visitHandler, parents, handlers, data)
        break
      case 'table':
        const extendedTableNode = _applyExtendedTableProps(node)
        tmp += handler(extendedTableNode, visitHandler, parents, handlers, data)
        break
      case 'footnoteDefinition':
        footnoteTmp += handler(node, visitHandler, parents, handlers, data)
        break
      default:
        tmp += handler(node, visitHandler, parents, handlers, data)
        break
    }
  }
  parents.pop()
  return `${tmp}${footnoteTmp}`
}

export const transformMarkdown = (
  markdown: string,
  handlers: MarkdownHandlers = stripAllHandlers,
  preProcessor?: (root: Root) => Record<string, unknown>
): string => {
  const tree = remark().use(remarkGfm).parse(markdown)
  const data = preProcessor?.(tree) ?? {}
  return visitTree(tree, handlers, [], data)
}
