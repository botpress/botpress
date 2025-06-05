import type * as BabelCore from '@babel/core'
import {
  expressionStatement,
  identifier,
  stringLiteral,
  callExpression,
  arrowFunctionExpression,
  blockStatement,
  VariableDeclaration,
  returnStatement,
  tryStatement,
  numericLiteral,
  CallExpression,
  LVal,
  catchClause,
  throwStatement,
  awaitExpression,
  variableDeclaration,
  variableDeclarator,
  newExpression,
  memberExpression,
  assignmentExpression,
  binaryExpression,
} from '@babel/types'

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

const extractLVal = (path: BabelCore.NodePath<BabelCore.types.LVal>): Assignment => {
  let source = path.getSource()
  if (path.isIdentifier()) {
    return {
      type: 'single',
      left: source,
      evalFn: `let ${source} = arguments[0]; return { ${source} };`,
    }
  }

  if (path.isArrayPattern()) {
    source = path
      .get('elements')
      .map((el) => el.getSource())
      .join(', ')

    return {
      type: 'array',
      left: source,
      evalFn: `let [${source}] = arguments[0] ?? []; return { ${source} };`,
    }
  }

  if (path.isObjectPattern()) {
    return {
      type: 'object',
      left: source,
      evalFn: `let ${source} = arguments[0] ?? {}; return ${source};`,
    }
  }

  return {
    type: 'unsupported',
    evalFn: '',
    left: '',
  }
}

export const toolCallTrackingPlugin = (calls: Map<number, ToolCallEntry> = new Map()) =>
  function ({}: { types: typeof BabelCore.types }): BabelCore.PluginObj {
    let callId = 0
    const skip = new Set<CallExpression>()

    return {
      visitor: {
        Program() {
          callId = 0
          skip.clear()
        },
        CallExpression(path) {
          if (skip.has(path.node) || path.findParent((p) => skip.has(p.node as any))) {
            // has been replaced
            return
          }

          if (path.parentPath.isYieldExpression()) {
            // we don't track yield expressions
            return
          }

          let lval: BabelCore.NodePath<LVal> | null = null

          const declaration = path.findParent((p) =>
            p.isVariableDeclaration()
          ) as BabelCore.NodePath<VariableDeclaration>
          // const a = myFunc()
          //       ^

          const assignment = path.findParent((p) =>
            p.isAssignmentExpression()
          ) as BabelCore.NodePath<BabelCore.types.AssignmentExpression>

          // let a;
          // a = myFunc()
          // ^

          if (declaration) {
            lval = declaration.get('declarations')[0]?.get('id')!
          }

          if (assignment) {
            const left = assignment.get('left')
            if (left.isLVal()) {
              lval = left
            }
          }

          const endStatement = (value: BabelCore.types.Expression) =>
            expressionStatement(
              callExpression(identifier(ToolCallTrackerFnIdentifier), [
                numericLiteral(callId),
                stringLiteral('end'),
                value,
              ])
            )

          const isAsync = path.parentPath.isAwaitExpression()

          const tryBodyStatement = blockStatement([
            expressionStatement(
              callExpression(identifier(ToolCallTrackerFnIdentifier), [numericLiteral(callId), stringLiteral('start')])
            ),
            variableDeclaration('const', [
              variableDeclarator(
                identifier(ToolTrackerRetIdentifier),
                isAsync ? awaitExpression(path.node) : path.node
              ),
            ]),
            endStatement(identifier(ToolTrackerRetIdentifier)),
            returnStatement(identifier(ToolTrackerRetIdentifier)),
          ])

          if (!lval) {
            if (path.getSource().trim().length) {
              // rethrow errors from the call expression here
              const newError = identifier('__newError')

              const newCall = callExpression(
                arrowFunctionExpression(
                  [], // params
                  blockStatement([
                    tryStatement(
                      tryBodyStatement,
                      catchClause(
                        identifier('err'),
                        blockStatement([
                          endStatement(identifier('err')),
                          variableDeclaration('const', [
                            variableDeclarator(
                              newError,
                              newExpression(identifier('Error'), [
                                memberExpression(identifier('err'), identifier('message')),
                              ])
                            ),
                          ]),

                          expressionStatement(
                            assignmentExpression(
                              '=',
                              memberExpression(newError, identifier('stack')),
                              binaryExpression(
                                '+',
                                memberExpression(identifier('err'), identifier('stack')),
                                binaryExpression(
                                  '+',
                                  stringLiteral('\n'),
                                  memberExpression(newError, identifier('stack'))
                                )
                              )
                            )
                          ),

                          throwStatement(newError),
                        ])
                      )
                    ),
                  ]),
                  isAsync
                ),
                [] // args
              )

              callId++
              skip.add(newCall)
              path.replaceWith(newCall)
            }

            return
          }

          callId++
          const parts = path.get('callee').getSource().split('.')
          const object = parts.length === 1 ? 'global' : parts[0]!
          const tool = parts.length === 1 ? parts[0]! : parts[1]!
          const assign = extractLVal(lval)

          if (assign.type === 'unsupported') {
            return
          }

          const newCall = callExpression(
            arrowFunctionExpression(
              [], // params
              blockStatement([
                tryStatement(
                  tryBodyStatement,
                  catchClause(
                    identifier('err'),
                    blockStatement([
                      endStatement(identifier('err')),
                      throwStatement(
                        newExpression(identifier('Error'), [memberExpression(identifier('err'), identifier('message'))])
                      ),
                    ])
                  )
                ),
              ]),
              isAsync
            ),
            [] // args
          )

          calls.set(callId, { object, tool, assignment: assign })
          skip.add(newCall)
          path.replaceWith(newCall)
        },
      },
    }
  }
