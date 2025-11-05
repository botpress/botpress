import { Node } from 'mdast'
import { RootNodes, MarkdownHandlers, NodeHandler } from './types'

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
