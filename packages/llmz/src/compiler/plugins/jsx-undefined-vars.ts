import { types as t, type PluginObj } from '@babel/core'

/**
 * This plugin transforms JSX expressions that reference undefined variables
 * into safe fallbacks that display the variable name as a string.
 *
 * For example:
 *   <div>{content}</div>
 * becomes:
 *   <div>{(() => { try { return content } catch { return 'content' } })()}</div>
 *
 * This prevents "variable is not defined" errors when the LLM generates JSX
 * with variable references that don't exist in the actual execution scope.
 */
export function jsxUndefinedVarsPlugin(): PluginObj {
  return {
    name: 'jsx-undefined-vars',
    visitor: {
      JSXExpressionContainer(path) {
        const expression = path.node.expression

        // Skip JSXEmptyExpression
        if (t.isJSXEmptyExpression(expression)) {
          return
        }

        // Only handle simple identifier references (not member expressions, calls, etc.)
        // We want to catch things like {content} but not {obj.prop} or {func()}
        if (!t.isIdentifier(expression)) {
          return
        }

        const varName = expression.name

        // Don't wrap known globals or special identifiers
        const knownGlobals = new Set([
          'undefined',
          'null',
          'true',
          'false',
          'NaN',
          'Infinity',
          'console',
          'Math',
          'JSON',
          'Object',
          'Array',
          'String',
          'Number',
          'Boolean',
          'Date',
          'RegExp',
          'Error',
          'Promise',
          'Symbol',
        ])

        if (knownGlobals.has(varName)) {
          return
        }

        // Create: (() => { try { return varName } catch { return 'varName' } })()
        const iife = t.callExpression(
          t.arrowFunctionExpression(
            [],
            t.blockStatement([
              t.tryStatement(
                t.blockStatement([t.returnStatement(t.identifier(varName))]),
                t.catchClause(
                  null, // no error binding needed
                  t.blockStatement([t.returnStatement(t.stringLiteral(varName))])
                )
              ),
            ])
          ),
          []
        )

        path.node.expression = iife
      },
    },
  }
}
