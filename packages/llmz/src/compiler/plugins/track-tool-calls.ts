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
      return {
        type: 'single',
        left: source,
        evalFn: `let ${source} = arguments[0]; return { ${source} };`,
      }
    }

    if (lval.type === 'ArrayPattern' || lval.type === 'ObjectPattern') {
      const bindings = (pattern: AnyNode | null): string[] => {
        if (!pattern) {
          return []
        }

        if (pattern.type === 'Identifier') {
          return [pattern.name]
        }

        if (pattern.type === 'RestElement') {
          return bindings(pattern.argument)
        }

        if (pattern.type === 'AssignmentPattern') {
          return bindings(pattern.left)
        }

        if (pattern.type === 'ArrayPattern') {
          return pattern.elements.flatMap(bindings)
        }

        if (pattern.type === 'ObjectPattern') {
          return pattern.properties.flatMap((prop: AnyNode) =>
            bindings(prop.type === 'RestElement' ? prop.argument : prop.value)
          )
        }

        return []
      }
      const captured = [...new Set(bindings(lval))].join(', ')
      return {
        type: lval.type === 'ArrayPattern' ? 'array' : 'object',
        left: lval.type === 'ArrayPattern' ? source.slice(1, -1) : source,
        evalFn: `let ${source} = arguments[0]; return { ${captured} };`,
      }
    }

    return {
      type: 'unsupported',
      left: '',
      evalFn: '',
    }
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

    // A synchronous wrapper cannot contain an await from the original call's
    // arguments (e.g. values.push(await fetch())). Leave the outer call intact
    // and let the traversal instrument its awaited inner calls instead.
    if (parent?.type !== 'AwaitExpression') {
      let containsAwait = false
      walk(node, (child, _parent, ancestors) => {
        if (
          child.type === 'AwaitExpression' &&
          !ancestors.some((ancestor) =>
            ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(ancestor.type)
          )
        ) {
          containsAwait = true
        }
      })
      if (containsAwait) {
        return
      }
    }

    const declaration = [...ancestors].reverse().find((n) => n.type === 'VariableDeclarator')
    const assignment = [...ancestors].reverse().find((n) => n.type === 'AssignmentExpression')
    let lval: AnyNode | null = null
    if (declaration) {
      lval = declaration.id ?? null
    }

    if (assignment) {
      lval = assignment.left
    }

    const isAsync = parent?.type === 'AwaitExpression'
    const start = (id: number) => `${ToolCallTrackerFnIdentifier}(${id}, "start");`
    const end = (id: number, value: string, awaited = false) =>
      `${ToolCallTrackerFnIdentifier}(${id}, "end", ${value}, ${awaited});`
    const prefix = (id: number) =>
      `(${isAsync ? 'async ' : ''}() => {try {${start(id)}const ${ToolTrackerRetIdentifier} = ${isAsync ? 'await ' : ''}`
    const successSuffix = (id: number) => `;${end(id, ToolTrackerRetIdentifier)}return ${ToolTrackerRetIdentifier};}`
    if (!lval) {
      if (!sliceOf(node).trim().length) {
        return
      }

      // bare calls: report and rethrow with the original stack appended
      const catchClause =
        ` catch (err) {${end(callId, 'err', isAsync)}` +
        'const __newError = new Error(err.message);' +
        '__newError.name = err.name || "Error";' +
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
      if (property.type === 'Identifier') {
        tool = property.name
      } else if (property.type === 'Literal') {
        tool = String(property.value)
      } else {
        tool = sliceOf(property)
      }
    }

    const catchClause =
      ` catch (err) {${end(callId, 'err', isAsync)}` +
      'const __newError = new Error(err.message);' +
      '__newError.name = err.name || "Error";' +
      'throw __newError;}})()'
    ctx.ms.appendLeft(node.start, prefix(tryId))
    ctx.ms.appendRight(node.end, successSuffix(tryId) + catchClause)
    wrappedRanges.push([node.start, node.end])
    calls.set(callId, {
      object,
      tool,
      assignment: assign,
    })
  })
  return wrappedRanges
}
