import uniqBy from 'lodash/uniqBy.js'
import { type Options } from '.'
import { generateType } from './generator'
import { type AST, T_ANY, T_UNKNOWN } from './types/AST'
import { log } from './utils'

export function optimize(ast: AST, options: Options, processed = new Set<AST>()): AST {
  if (processed.has(ast)) {
    return ast
  }

  processed.add(ast)

  switch (ast.type) {
    case 'INTERFACE':
      return Object.assign(ast, {
        params: ast.params.map((_) => Object.assign(_, { ast: optimize(_.ast, options, processed) })),
      })
    case 'INTERSECTION':
    case 'UNION':
      // Start with the leaves...
      const optimizedAST = Object.assign(ast, {
        params: ast.params.map((_) => optimize(_, options, processed)),
      })

      // [A, B, C, Any] -> Any
      if (optimizedAST.params.some((_) => _.type === 'ANY')) {
        log('cyan', 'optimizer', '[A, B, C, Any] -> Any', optimizedAST)
        return T_ANY
      }

      // [A, B, C, Unknown] -> Unknown
      if (optimizedAST.params.some((_) => _.type === 'UNKNOWN')) {
        log('cyan', 'optimizer', '[A, B, C, Unknown] -> Unknown', optimizedAST)
        return T_UNKNOWN
      }

      // [A (named), A] -> [A (named)]
      if (
        optimizedAST.params.every((_) => {
          const a = generateType(omitStandaloneName(_), options)
          const b = generateType(omitStandaloneName(optimizedAST.params[0]!), options)
          return a === b
        }) &&
        optimizedAST.params.some((_) => _.standaloneName !== undefined)
      ) {
        log('cyan', 'optimizer', '[A (named), A] -> [A (named)]', optimizedAST)
        optimizedAST.params = optimizedAST.params.filter((_) => _.standaloneName !== undefined)
      }

      // [A, B, B] -> [A, B]
      const params = uniqBy(optimizedAST.params, (_) => generateType(_, options))
      if (params.length !== optimizedAST.params.length) {
        log('cyan', 'optimizer', '[A, B, B] -> [A, B]', optimizedAST)
        optimizedAST.params = params
      }

      return Object.assign(optimizedAST, {
        params: optimizedAST.params.map((_) => optimize(_, options, processed)),
      })
    default:
      return ast
  }
}

// TODO: More clearly disambiguate standalone names vs. aliased names instead.
function omitStandaloneName<A extends AST>(ast: A): A {
  switch (ast.type) {
    case 'ENUM':
      return ast
    default:
      return { ...ast, standaloneName: undefined }
  }
}
