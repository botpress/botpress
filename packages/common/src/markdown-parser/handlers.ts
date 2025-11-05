import { List, Table } from 'mdast'
import { visitTree } from './tree-visitor'
import { MarkdownHandlers, RootNodes } from './types'

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
