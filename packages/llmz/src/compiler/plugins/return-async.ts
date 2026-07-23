import { type Program } from 'acorn'
import { type AnyNode } from '../ast.js'

export type LastLineEdit = {
  prefixPos: number
  prefix: string
  suffixPos: number
  suffix: string
}

/**
 * Plans the instrumentation of the last statement of the `__fn__` wrapper so
 * the generated code always returns an awaited value (the isolated VM cannot
 * return a pending Promise):
 * - `return expr` → `return await (expr)`
 * - a trailing `call()` / `await call()` statement → `return await (…)`
 *
 * The prefix must be applied before, and the suffix after, all other edits so
 * they wrap around the tool-call instrumentation.
 */
export function planLastLineInstrumentation(ast: Program): LastLineEdit | null {
  const fn = ast.body.find((node) => node.type === 'FunctionDeclaration' && (node as AnyNode).id?.name === '__fn__') as
    | AnyNode
    | undefined
  if (!fn) {
    return null
  }

  const statements: AnyNode[] = fn.body.body
  const last = statements[statements.length - 1]
  if (!last) {
    return null
  }

  if (last.type === 'ReturnStatement') {
    if (!last.argument) {
      return null
    }
    return { prefixPos: last.argument.start, prefix: 'await (', suffixPos: last.argument.end, suffix: ')' }
  }

  if (
    last.type === 'ExpressionStatement' &&
    (last.expression.type === 'CallExpression' || last.expression.type === 'AwaitExpression')
  ) {
    return { prefixPos: last.expression.start, prefix: 'return await (', suffixPos: last.expression.end, suffix: ')' }
  }

  return null
}
