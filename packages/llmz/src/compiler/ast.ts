import { parse, type Comment, type Node, type Options, type Program } from 'acorn'
import type MagicString from 'magic-string'

/** An acorn node with free access to its type-specific properties */
export type AnyNode = Node & Record<string, any>

export type Ctx = {
  code: string
  ms: MagicString
  ast: Program
  comments: Comment[]
}

const TS_SMELL =
  /(^|[^:]):\s*(string|number|boolean|any|unknown|void)\b|\bas\s+(const\b|[A-Z])|\binterface\s+[A-Z]|^\s*type\s+[A-Z]|[a-zA-Z)\]]!\.|<(string|number|boolean)[,>]/m

export function parseScript(code: string, opts?: Partial<Options> & { comments?: Comment[] }): Program {
  try {
    return parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'script',
      locations: true,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      ...opts,
      onComment: opts?.comments,
    })
  } catch (err) {
    if (err instanceof SyntaxError && TS_SMELL.test(code)) {
      err.message +=
        '. The code must be plain JavaScript: do not use TypeScript syntax (type annotations, "as" casts, generics, interfaces or type aliases).'
    }
    throw err
  }
}

/**
 * Depth-first pre-order walk. `ancestors` is ordered outermost → innermost and
 * excludes `node` itself; `parent` is `ancestors[ancestors.length - 1]`.
 */
export function walk(root: Node, enter: (node: AnyNode, parent: AnyNode | null, ancestors: AnyNode[]) => void): void {
  const ancestors: AnyNode[] = []

  const visit = (node: AnyNode) => {
    enter(node, ancestors[ancestors.length - 1] ?? null, ancestors)
    ancestors.push(node)
    for (const key of Object.keys(node)) {
      if (key === 'loc') {
        continue
      }
      const value = node[key]
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNode(child)) {
            visit(child)
          }
        }
      } else if (isNode(value)) {
        visit(value)
      }
    }
    ancestors.pop()
  }

  visit(root as AnyNode)
}

const isNode = (value: unknown): value is AnyNode =>
  !!value && typeof value === 'object' && typeof (value as AnyNode).type === 'string'

export const isStatementContainer = (node: AnyNode | null): boolean =>
  !!node && (node.type === 'Program' || node.type === 'BlockStatement' || node.type === 'StaticBlock')

/**
 * The statement that contains `node`: the outermost ancestor (or the node
 * itself) whose parent is a statement container.
 */
export function enclosingStatement(node: AnyNode, ancestors: AnyNode[]): AnyNode | null {
  const chain = [...ancestors, node]
  for (let i = chain.length - 1; i > 0; i--) {
    if (isStatementContainer(chain[i - 1]!)) {
      return chain[i]!
    }
  }
  return null
}

/** The innermost node whose range contains [start, end] */
export function innermostContaining(ast: Program, start: number, end: number): AnyNode | null {
  let best: AnyNode | null = null
  walk(ast, (node) => {
    if (node.start <= start && node.end >= end) {
      if (!best || (node.start >= best.start && node.end <= best.end)) {
        best = node
      }
    }
  })
  return best
}
