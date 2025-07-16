// eslint-disable no-lonely-if
import type * as BabelCore from '@babel/core'
import { callExpression, expressionStatement, identifier, numericLiteral } from '@babel/types'

export const LineTrackingFnIdentifier = '__track__'

export const lineTrackingBabelPlugin = function ({ types: t }: { types: typeof BabelCore.types }): BabelCore.PluginObj {
  return {
    visitor: {
      Program(path) {
        const trackedLines = new Set()
        const lineTrackingCall = (line: number) => {
          trackedLines.add(line)
          return expressionStatement(callExpression(identifier(LineTrackingFnIdentifier), [numericLiteral(line)]))
        }
        path.traverse({
          enter(path) {
            if (path.node.loc && !path.isProgram()) {
              const { line: startLine } = path.node.loc.start
              const node = path.node

              const track = () => {
                try {
                  path.insertBefore(lineTrackingCall(startLine))
                } catch (e) {
                  console.error(e)
                }
              }

              if (
                t.isFunctionDeclaration(node) ||
                t.isClassMethod(node) ||
                t.isReturnStatement(node) ||
                t.isAwaitExpression(node) ||
                t.isForOfStatement(node) ||
                t.isCallExpression(node) ||
                t.isUnaryExpression(node) ||
                t.isVariableDeclaration(node) ||
                t.isBlockStatement(path.parent) ||
                t.isAssignmentExpression(node)
              ) {
                if (
                  !trackedLines.has(startLine) &&
                  !t.isArrowFunctionExpression(path.parent) &&
                  !t.isObjectProperty(path.parent) &&
                  !t.isAwaitExpression(path.parent) &&
                  !t.isUnaryExpression(path.parent) &&
                  !t.isReturnStatement(path.parent) &&
                  !t.isForOfStatement(path.parent) &&
                  !t.isForStatement(path.parent) &&
                  !t.isForInStatement(path.parent) &&
                  !t.isVariableDeclaration(path.parent) &&
                  !t.isBinaryExpression(path.parent) &&
                  !t.isLogicalExpression(path.parent)
                ) {
                  track()
                }
              }
            }
          },
        })
      },
    },
  }
}
