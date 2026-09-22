import { walk, type AnyNode, type Ctx } from '../ast.js'

export const MissingToolIdentifier = '__llmz_missing_tool'

/** Diagnose missing free callables at the lookup, before evaluating their arguments. */
export function applyToolResolution({ ast, ms }: Ctx): void {
  // Conservatively leave every locally declared name to JavaScript's scope rules.
  // This also preserves temporal dead zones, optional calls, and undefined locals.
  const declared = new Set<string>()
  const collect = (pattern: AnyNode) => {
    walk(pattern, (node) => {
      if (node.type === 'Identifier') {
        declared.add(node.name)
      }
    })
  }
  walk(ast, (node) => {
    if (node.type === 'VariableDeclarator') {
      collect(node.id)
    } else if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) {
      if (node.id) {
        collect(node.id)
      }

      for (const param of node.params) {
        collect(param)
      }
    } else if (node.type === 'CatchClause' && node.param) {
      collect(node.param)
    } else if (node.type === 'ClassDeclaration' && node.id) {
      collect(node.id)
    }
  })

  walk(ast, (node) => {
    if (node.type !== 'CallExpression' || node.optional || node.callee.type !== 'Identifier') {
      return
    }

    const name: string = node.callee.name
    if (declared.has(name) || name.startsWith('__')) {
      return
    }

    ms.overwrite(
      node.callee.start,
      node.callee.end,
      `(typeof ${name} === "undefined" ? ${MissingToolIdentifier}(${JSON.stringify(name)}) : ${name})`
    )
  })
}
