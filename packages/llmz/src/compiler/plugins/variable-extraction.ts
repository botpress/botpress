import type * as BabelCore from '@babel/core'
import {
  expressionStatement,
  identifier,
  stringLiteral,
  callExpression,
  arrowFunctionExpression,
  blockStatement,
  returnStatement,
} from '@babel/types'

export const VariableTrackingFnIdentifier = '__var__'

export const variableTrackingPlugin = (variables: Set<string> = new Set<string>()) =>
  function ({ types: t }: { types: typeof BabelCore.types }): BabelCore.PluginObj {
    let trackingStatements: BabelCore.types.ExpressionStatement[] = []
    const trackVariable = (variableName: string) => {
      if (variableName.startsWith('__')) {
        return
      }
      variables.add(variableName)
      trackingStatements.push(
        expressionStatement(
          callExpression(identifier(VariableTrackingFnIdentifier), [
            stringLiteral(variableName),
            arrowFunctionExpression([], callExpression(identifier('eval'), [stringLiteral(variableName)])),
          ])
        )
      )
    }

    return {
      visitor: {
        FunctionDeclaration(path) {
          path.node.params.forEach((param) => {
            if (t.isIdentifier(param)) {
              trackVariable(param.name)
            } else if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) {
              trackVariable(param.left.name)
            } else if (t.isObjectPattern(param)) {
              param.properties.forEach((prop) => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
                  trackVariable(prop.value.name)
                }
              })
            } else if (t.isArrayPattern(param)) {
              param.elements.forEach((element) => {
                if (t.isIdentifier(element)) {
                  trackVariable(element.name)
                }
              })
            }
          })

          if (trackingStatements.length) {
            path.get('body').unshiftContainer('body', trackingStatements)
            trackingStatements = []
          }
        },

        ArrowFunctionExpression(path) {
          path.node.params.forEach((param) => {
            if (t.isIdentifier(param)) {
              trackVariable(param.name)
            } else if (t.isAssignmentPattern(param) && t.isIdentifier(param.left)) {
              trackVariable(param.left.name)
            } else if (t.isObjectPattern(param)) {
              param.properties.forEach((prop) => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
                  trackVariable(prop.value.name)
                }
              })
            } else if (t.isArrayPattern(param)) {
              param.elements.forEach((element) => {
                if (t.isIdentifier(element)) {
                  trackVariable(element.name)
                }
              })
            }
          })

          if (trackingStatements.length) {
            const body = path.get('body')
            if (body.isBlockStatement()) {
              body.unshiftContainer('body', trackingStatements)
            } else if (body.isExpression() && body.getSource().trim().length) {
              const newBody = blockStatement([...trackingStatements, returnStatement(body.node)])
              path.get('body').replaceWith(newBody)
            }
            trackingStatements = []
          }
        },

        VariableDeclaration(path) {
          const parent = path.parentPath

          const handleObjectPattern = (pattern: BabelCore.types.ObjectPattern) => {
            pattern.properties.forEach((prop) => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
                trackVariable(prop.value.name)
              } else if (t.isObjectProperty(prop) && t.isObjectPattern(prop.value)) {
                handleObjectPattern(prop.value) // Handle nested object destructuring
              } else if (
                t.isObjectProperty(prop) &&
                t.isAssignmentPattern(prop.value) &&
                t.isIdentifier(prop.value.left)
              ) {
                trackVariable(prop.value.left.name) // Handle default values
              }
            })
          }

          path.node.declarations.forEach((declarator) => {
            if (parent.isForXStatement() || parent.isForStatement()) {
              // Inside loops
              // for (const { a, b } of [{ a: 1, b: 2 }]) {
              // We don't want to track those, at least not for now
              return
            }

            if (t.isIdentifier(declarator.id)) {
              // Simple variable declaration
              // const a = 10
              trackVariable(declarator.id.name)
            }

            if (t.isObjectPattern(declarator.id)) {
              // Destructuring assignment
              // const { a, b } = { a: 1, b: 2 }
              handleObjectPattern(declarator.id)
            }

            if (t.isArrayPattern(declarator.id)) {
              declarator.id.elements.forEach((element) => {
                if (t.isIdentifier(element)) {
                  trackVariable(element.name)
                } else if (t.isRestElement(element) && t.isIdentifier(element.argument)) {
                  trackVariable(element.argument.name) // Handle rest elements in array destructuring
                } else if (t.isAssignmentPattern(element) && t.isIdentifier(element.left)) {
                  trackVariable(element.left.name) // Handle default values
                }
              })
            }
          })

          if (trackingStatements.length) {
            path.insertAfter(trackingStatements)
            trackingStatements = []
          }
        },
      },
    }
  }
