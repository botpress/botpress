import type TurndownService from 'turndown'
import { isElementOfType } from '../common'

const rules: Record<string, TurndownService.Rule> = {}

rules.tableCell = {
  filter: ['th', 'td'],
  replacement(content: string, node: HTMLElement) {
    return cell(content, node).replace(/\n/g, '')
  },
}

rules.tableRow = {
  filter: 'tr',
  replacement(content: string, node: HTMLElement) {
    let borderCells = ''
    const alignMap: Record<string, string> = { left: ':--', right: '--:', center: ':-:' }

    if (isHeadingRow(node)) {
      Array.from(node.children).forEach((child) => {
        let border = '---'
        const align = (child.getAttribute('align') || '').toLowerCase()

        if (align) border = alignMap[align] || border

        borderCells += cell(border, child)
      })
    } else {
    }
    return '\n' + content + (borderCells ? '\n' + borderCells : '')
  },
}

const _isTableWithHeadingRow = (node: Element) => {
  if (!isElementOfType(node, 'table')) return false
  const firstRow = node.rows[0]

  return !!firstRow && isHeadingRow(firstRow)
}

rules.table = {
  // Only convert tables with a heading row.
  // Tables with no heading row are kept using `keep` (see below).
  filter: (node) => _isTableWithHeadingRow(node),
  replacement(content) {
    // Ensure there are no blank lines
    content = content.replace('\n\n', '\n')
    return '\n\n' + content + '\n\n'
  },
}

rules.tableSection = {
  filter: ['thead', 'tbody', 'tfoot'],
  replacement(content: string) {
    return content
  },
}

// A tr is a heading row if:
// - the parent is a THEAD
// - or if its the first child of the TABLE or the first TBODY (possibly
//   following a blank THEAD)
// - and every cell is a TH
function isHeadingRow(tr: HTMLElement) {
  const parentNode = tr.parentNode

  return (
    parentNode?.nodeName === 'THEAD' ||
    (parentNode?.firstChild === tr && (parentNode.nodeName === 'TABLE' || isFirstTbody(parentNode)))
  )
}

function isFirstTbody(element: Node) {
  const previousSibling = element.previousSibling
  return (
    element.nodeName === 'TBODY' &&
    (!previousSibling || (previousSibling.nodeName === 'THEAD' && /^\s*$/i.test(previousSibling.textContent ?? '')))
  )
}

function cell(content: string, node: Element) {
  const childNodes = Array.from(node.parentNode?.childNodes ?? [])
  const index = childNodes.indexOf(node)
  let prefix = ' '
  if (index === 0) prefix = '| '
  return prefix + content + ' |'
}

export const tables = (turndownService: TurndownService) => {
  turndownService.keep((node) => !isElementOfType(node, 'table'))
  for (const [key, rule] of Object.entries(rules)) {
    turndownService.addRule(key, rule)
  }
}
