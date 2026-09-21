import { walk, type AnyNode, type Ctx } from '../ast.js'

export const TerminationGuardIdentifier = '__llmz_guard'
export const TerminationCheckpointIdentifier = '__llmz_checkpoint'

const FUNCTIONS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])
const INTERNAL_CALLS = new Set(['__var__', '__track__', '__comment__'])

/**
 * A terminal host call unwinds ordinary JavaScript. User error handlers must not
 * consume that control flow, and async continuations must check before resuming.
 */
export function applyTerminationGuards(ctx: Ctx): () => void {
  const suffixes: (() => void)[] = []
  const wrapper = ctx.ast.body.find(
    (node) => node.type === 'FunctionDeclaration' && (node as AnyNode).id?.name === '__fn__'
  )
  const guard = `${TerminationGuardIdentifier}();`
  const wrap = (node: AnyNode, prefix: string): void => {
    ctx.ms.appendLeft(node.start, prefix)
    suffixes.unshift(() => ctx.ms.appendRight(node.end, ')'))
  }

  const isCaptureGetter = (node: AnyNode, parent: AnyNode | null): boolean =>
    parent?.type === 'CallExpression' && parent.callee.name === '__var__' && parent.arguments[1] === node

  walk(ctx.ast, (node, parent, ancestors) => {
    if (
      isCaptureGetter(node, parent) ||
      ancestors.some((ancestor, index) => isCaptureGetter(ancestor, ancestors[index - 1] ?? null))
    ) {
      return
    }

    const isInternalCall =
      node.type === 'CallExpression' && node.callee.type === 'Identifier' && INTERNAL_CALLS.has(node.callee.name)

    if (isInternalCall) {
      return
    }

    if (node.type === 'CatchClause') {
      ctx.ms.appendLeft(node.body.start + 1, guard)
      return
    }

    if (node.type === 'TryStatement' && node.finalizer) {
      ctx.ms.appendLeft(node.finalizer.start + 1, guard)
    }

    if (FUNCTIONS.has(node.type)) {
      if (node === wrapper) {
        return
      }

      if (node.body.type === 'BlockStatement') {
        ctx.ms.appendLeft(node.body.start + 1, guard)
      } else {
        wrap(node.body, `(${TerminationGuardIdentifier}(), `)
      }
    }

    if (node.type === 'AssignmentPattern') {
      wrap(node.right, `(${TerminationGuardIdentifier}(), `)
    }

    if (['AwaitExpression', 'CallExpression', 'NewExpression', 'TaggedTemplateExpression'].includes(node.type)) {
      wrap(node, `(${TerminationGuardIdentifier}(), ${TerminationCheckpointIdentifier}(`)
      suffixes.unshift(() => ctx.ms.appendRight(node.end, ')'))
    }

    if (
      node.type === 'AssignmentExpression' ||
      node.type === 'UpdateExpression' ||
      (node.type === 'UnaryExpression' && node.operator === 'delete')
    ) {
      wrap(node, `(${TerminationGuardIdentifier}(), `)
    }
  })

  return () => suffixes.forEach((apply) => apply())
}
