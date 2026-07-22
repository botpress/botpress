import { enclosingStatement, walk, type Ctx } from '../ast.js'

export const LineTrackingFnIdentifier = '__track__'

const TRACKED_TYPES = new Set([
  'FunctionDeclaration',
  'MethodDefinition',
  'ReturnStatement',
  'AwaitExpression',
  'ForOfStatement',
  'CallExpression',
  'UnaryExpression',
  'VariableDeclaration',
  'AssignmentExpression',
])

const SKIPPED_PARENT_TYPES = new Set([
  'ArrowFunctionExpression',
  'Property',
  'AwaitExpression',
  'UnaryExpression',
  'ReturnStatement',
  'ForOfStatement',
  'ForStatement',
  'ForInStatement',
  'VariableDeclaration',
  'BinaryExpression',
  'LogicalExpression',
])

/**
 * Inserts a `__track__(<line>)` call before the statement containing each
 * tracked node — at most one per source line.
 */
export function applyLineTracking(ctx: Ctx): void {
  const trackedLines = new Set<number>()

  walk(ctx.ast, (node, parent, ancestors) => {
    if (!parent || !node.loc) {
      return
    }

    if (!TRACKED_TYPES.has(node.type) && parent.type !== 'BlockStatement') {
      return
    }

    const line = node.loc.start.line
    if (trackedLines.has(line) || SKIPPED_PARENT_TYPES.has(parent.type)) {
      return
    }

    const statement = enclosingStatement(node, ancestors)
    if (!statement) {
      return
    }

    trackedLines.add(line)
    ctx.ms.appendLeft(statement.start, `${LineTrackingFnIdentifier}(${line});`)
  })
}
