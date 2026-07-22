import { walk, type AnyNode, type Ctx } from '../ast.js'

export const ToolCallTrackerFnIdentifier = '__toolc__'
export const ToolTrackerRetIdentifier = '__ret__'

export type Assignment = {
  type: 'single' | 'object' | 'array' | 'unsupported'
  left: string
  evalFn: string
}

export type ToolCallEntry = {
  object: string
  tool: string
  assignment: Assignment
}

/**
 * Wraps every outermost call expression in an IIFE that reports
 * `__toolc__(<id>, "start" | "end", …)` events around the call:
 *
 *     const x = (() => {
 *       try {
 *         __toolc__(0, "start");
 *         const __ret__ = tool();
 *         __toolc__(0, "end", __ret__);
 *         return __ret__;
 *       } catch (err) { __toolc__(1, "end", err); throw new Error(err.message); }
 *     })()
 *
 * Calls assigned to a variable are registered in `calls` (keyed by the id used
 * in the catch clause — the id the runtime sees when a tool throws a
 * SnapshotSignal). Awaited calls get an async IIFE that awaits the call.
 *
 * Returns the wrapped source ranges so later passes can avoid editing inside.
 */
export function applyToolCallTracking(ctx: Ctx, calls: Map<number, ToolCallEntry>): Array<[number, number]> {
  let callId = 0
  const wrappedRanges: Array<[number, number]> = []
  const src = ctx.code

  const sliceOf = (node: AnyNode) => src.slice(node.start, node.end)

  const extractAssignment = (lval: AnyNode): Assignment => {
    const source = sliceOf(lval)
    if (lval.type === 'Identifier') {
      return { type: 'single', left: source, evalFn: `let ${source} = arguments[0]; return { ${source} };` }
    }
    if (lval.type === 'ArrayPattern') {
      const elements = (lval.elements as (AnyNode | null)[]).map((el) => (el ? sliceOf(el) : '')).join(', ')
      return {
        type: 'array',
        left: elements,
        evalFn: `let [${elements}] = arguments[0] ?? []; return { ${elements} };`,
      }
    }
    if (lval.type === 'ObjectPattern') {
      return { type: 'object', left: source, evalFn: `let ${source} = arguments[0] ?? {}; return ${source};` }
    }
    return { type: 'unsupported', left: '', evalFn: '' }
  }

  walk(ctx.ast, (node, parent, ancestors) => {
    if (node.type !== 'CallExpression') {
      return
    }
    if (wrappedRanges.some(([start, end]) => node.start >= start && node.end <= end)) {
      return // nested inside an already-wrapped call
    }
    if (parent?.type === 'YieldExpression') {
      return
    }

    const declaration = [...ancestors].reverse().find((n) => n.type === 'VariableDeclaration')
    const assignment = [...ancestors].reverse().find((n) => n.type === 'AssignmentExpression')

    let lval: AnyNode | null = null
    if (declaration) {
      lval = (declaration.declarations as AnyNode[])[0]?.id ?? null
    }
    if (assignment) {
      lval = assignment.left
    }

    const isAsync = parent?.type === 'AwaitExpression'

    const start = (id: number) => `${ToolCallTrackerFnIdentifier}(${id}, "start");`
    const end = (id: number, value: string) => `${ToolCallTrackerFnIdentifier}(${id}, "end", ${value});`

    const prefix = (id: number) =>
      `(${isAsync ? 'async ' : ''}() => {try {${start(id)}const ${ToolTrackerRetIdentifier} = ${isAsync ? 'await ' : ''}`
    const successSuffix = (id: number) => `;${end(id, ToolTrackerRetIdentifier)}return ${ToolTrackerRetIdentifier};}`

    if (!lval) {
      if (!sliceOf(node).trim().length) {
        return
      }
      // bare calls: report and rethrow with the original stack appended
      const catchClause =
        ` catch (err) {${end(callId, 'err')}` +
        'const __newError = new Error(err.message);' +
        '__newError.stack = err.stack + ("\\n" + __newError.stack);' +
        'throw __newError;}})()'

      ctx.ms.appendLeft(node.start, prefix(callId))
      ctx.ms.appendRight(node.end, successSuffix(callId) + catchClause)
      wrappedRanges.push([node.start, node.end])
      callId++
      return
    }

    const assign = extractAssignment(lval)
    if (assign.type === 'unsupported') {
      return
    }

    const tryId = callId
    callId++ // the catch clause and the registry use the incremented id

    // tool identity from the AST: `obj.tool()`, `obj[tool]()` or a global `tool()`
    const callee = node.callee as AnyNode
    let object = 'global'
    let tool = callee.type === 'Identifier' ? callee.name : sliceOf(callee)
    if (callee.type === 'MemberExpression') {
      object = sliceOf(callee.object)
      const property = callee.property as AnyNode
      tool =
        property.type === 'Identifier'
          ? property.name
          : property.type === 'Literal'
            ? String(property.value)
            : sliceOf(property)
    }

    const catchClause = ` catch (err) {${end(callId, 'err')}throw new Error(err.message);}})()`

    ctx.ms.appendLeft(node.start, prefix(tryId))
    ctx.ms.appendRight(node.end, successSuffix(tryId) + catchClause)
    wrappedRanges.push([node.start, node.end])

    calls.set(callId, { object, tool, assignment: assign })
  })

  return wrappedRanges
}
