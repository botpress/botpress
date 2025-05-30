import type * as BabelCore from '@babel/core'

export const CommentFnIdentifier = '__comment__'

export const replaceCommentBabelPlugin = function ({
  types: t,
}: {
  types: typeof BabelCore.types
}): BabelCore.PluginObj {
  return {
    visitor: {
      Program(path) {
        const processed = new Set()

        path.traverse({
          enter(path) {
            const node = path.node

            function processComments(
              comments: BabelCore.types.Comment[],
              insertMethod: (commentCall: BabelCore.types.Statement) => void
            ) {
              if (!comments) {
                return
              }
              comments
                .sort((a, b) => (a.start! > b.start! ? -1 : 1))
                .forEach((comment) => {
                  if (processed.has(comment.loc)) {
                    return
                  }
                  processed.add(comment.loc)

                  const commentCall = t.expressionStatement(
                    t.callExpression(t.identifier(CommentFnIdentifier), [
                      t.stringLiteral(comment.value.trim()),
                      t.numericLiteral(comment.loc?.start.line ?? 0),
                    ])
                  )

                  // Check if the current path is inside an object property
                  const isInsideObjectProperty =
                    t.isObjectProperty(node) || path.findParent((path) => t.isObjectProperty(path.node))

                  if (!isInsideObjectProperty) {
                    insertMethod(commentCall)
                  }
                })
              comments.length = 0 // Clear comments array
            }

            processComments(node.trailingComments ?? [], (commentCall) => path.insertAfter(commentCall))
            processComments(node.leadingComments ?? [], (commentCall) => path.insertBefore(commentCall))
            processComments(node.innerComments ?? [], (commentCall) => path.insertAfter(commentCall))
          },
        })
      },
    },
  }
}
