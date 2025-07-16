import type * as BabelCore from '@babel/core'

export const instrumentLastLinePlugin = function ({
  types: t,
}: {
  types: typeof BabelCore.types
}): BabelCore.PluginObj {
  return {
    visitor: {
      FunctionDeclaration(path) {
        // We only want to instrument the async generator __fn__ function
        if (path.node.id?.name !== '__fn__') {
          return
        }

        const statements = path.node.body.body
        if (statements.length === 0) {
          return
        }

        const lastStatement = statements[statements.length - 1]

        if (t.isReturnStatement(lastStatement)) {
          // We need to make sure that we always return an awaited expression
          // This is because isolated VM code can't return a Promise from this function, we need to return a value
          if (t.isExpression(lastStatement.argument)) {
            lastStatement.argument = t.awaitExpression(lastStatement.argument)
          }

          return
        } // Already a return statement

        // Check if the last statement is a function call, await expression, or promise
        if (
          t.isExpressionStatement(lastStatement) &&
          (t.isCallExpression(lastStatement.expression) || t.isAwaitExpression(lastStatement.expression))
        ) {
          // Replace the last statement with a return statement
          const returnStatement = t.returnStatement(t.awaitExpression(lastStatement.expression))
          path.get('body').get('body')[statements.length - 1]?.replaceWith(returnStatement)
        }
      },
    },
  }
}
