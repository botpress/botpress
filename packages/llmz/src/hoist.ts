import { CodeGenerator } from '@babel/generator'
import { parse } from '@babel/parser'
import { NodePath } from '@babel/traverse'

import Traverse from '@babel/traverse'
import * as t from '@babel/types'
import { upperFirst, cloneDeep } from 'lodash-es'

import { CodeFormattingError } from './errors.js'
import { CodeFormatOptions, formatTypings } from './formatting.js'

const traverse = Traverse as unknown as typeof import('@babel/traverse').default

function getTypingsWithoutComments(type: t.TSType) {
  const typeClone = cloneDeep(type)
  removeBabelComments(typeClone)
  return new CodeGenerator(typeClone, { comments: false }).generate().code
}

function removeBabelComments(node: t.Node) {
  // Babel stores comments as `leadingComments`, `trailingComments`, etc.
  // Setting them to null removes them.
  node.leadingComments = null
  node.trailingComments = null
  node.innerComments = null
  Object.keys(node).forEach((key) => {
    const val = (node as any)[key]
    if (Array.isArray(val)) {
      val.forEach((child) => child && typeof child === 'object' && removeBabelComments(child))
    } else if (val && typeof val === 'object' && val.type) {
      removeBabelComments(val)
    }
  })
}

function extractAndHoistTypes(ast: t.File) {
  const typeMap = new Map<string, t.TSTypeAliasDeclaration>()
  const typeCounts = new Map<string, number>()
  const hoistedTypes: t.TSTypeAliasDeclaration[] = []

  function addTypeToMap(typeNode: t.TSTypeAliasDeclaration) {
    const typeString = getTypingsWithoutComments(typeNode.typeAnnotation)
    if (!typeMap.has(typeString)) {
      typeMap.set(typeString, typeNode)
    }
  }

  function generateUniqueTypeName(baseName: string) {
    let typeName = baseName
    let counter = 1
    while ([...typeMap.values()].some((typeNode) => typeNode.id.name === typeName)) {
      typeName = `${baseName}${counter++}`
    }
    return typeName
  }

  function createTypeAlias(name: string, type: t.TSType) {
    // Babel’s TSTypeAliasDeclaration signature: tsTypeAliasDeclaration(id, typeParameters, typeAnnotation)
    return t.tsTypeAliasDeclaration(t.identifier(name), null, type)
  }

  function getTypePaths(path: NodePath<t.TSTypeLiteral>) {
    let currPath: NodePath | null = path
    const parts = new Set<string>()

    while (currPath) {
      const { node, parentPath } = currPath as { node: t.Node; parentPath: NodePath }

      if (t.isIdentifier(node) && node.name) {
        parts.add(node.name)
      }
      if (t.isTSMethodSignature(node) && currPath.key === 'parameters') {
        parts.add('Input')
      }
      if (currPath.key === 'returnType') {
        parts.add('Output')
        const methodName = 'id' in parentPath.node && 'name' in parentPath.node.id! && parentPath?.node?.id?.name
        if (methodName) {
          parts.add(methodName)
        }
      }
      if ((node as any)?.key?.type === 'Identifier') {
        parts.add((node as any).key.name)
      }
      if (t.isTSParameterProperty(node) || t.isTSFunctionType(node)) {
        parts.add('Input')
      }
      if (t.isTSFunctionType(node)) {
        parts.add('Output')
      }

      currPath = parentPath
    }
    return parts.size ? Array.from(parts).reverse().map(upperFirst) : ['UnnamedType']
  }

  function generateTypeName(path: NodePath<t.TSTypeLiteral>) {
    return getTypePaths(path).join('')
  }

  function findNestedTypes(path: NodePath<t.Node>) {
    const node = path.node

    // TSTypeLiteral
    if (t.isTSTypeLiteral(node)) {
      const typeString = getTypingsWithoutComments(node)
      typeCounts.set(typeString, (typeCounts.get(typeString) || 0) + 1)

      if (typeMap.has(typeString) && (typeCounts.get(typeString) || 0) > 1) {
        path.replaceWith(t.tsTypeReference(typeMap.get(typeString)!.id))
      } else if (!typeMap.has(typeString) && (typeCounts.get(typeString) || 0) > 1) {
        const typeName = generateUniqueTypeName(generateTypeName(path as NodePath<t.TSTypeLiteral>))
        const typeAlias = createTypeAlias(typeName, node as t.TSType)
        addTypeToMap(typeAlias)
        path.replaceWith(t.tsTypeReference(t.identifier(typeName)))
      }

      // Babel might return a single NodePath instead of an array
      const members = path.get('members')
      const memberPaths = Array.isArray(members) ? members : [members]

      memberPaths.forEach((memberPath) => {
        findNestedTypes(memberPath)
      })
    }

    // TSPropertySignature
    if (t.isTSPropertySignature(node) && path.get('typeAnnotation')) {
      const annPath = path.get('typeAnnotation.typeAnnotation') as NodePath
      if (annPath?.node) {
        findNestedTypes(annPath)
      }
    }

    // TSArrayType
    if (t.isTSArrayType(node)) {
      findNestedTypes(path.get('elementType') as NodePath)
    }

    // TSUnionType / TSIntersectionType
    if (t.isTSUnionType(node) || t.isTSIntersectionType(node)) {
      ;(path.get('types') as NodePath[]).forEach((p) => findNestedTypes(p))
    }

    // TSTypeReference
    if (t.isTSTypeReference(node) && node.typeParameters) {
      ;(path.get('typeParameters.params') as NodePath[]).forEach((param) => findNestedTypes(param))
    }

    // TSFunctionType
    if (t.isTSFunctionType(node)) {
      const returnPath = path.get('typeAnnotation') as NodePath
      if (returnPath?.node) findNestedTypes(returnPath)

      const params = path.get('parameters') as NodePath[]
      params.forEach((paramPath) => {
        const ta = paramPath.get('typeAnnotation.typeAnnotation') as NodePath
        if (ta?.node) findNestedTypes(ta)
      })
    }

    // TSMethodSignature
    if (t.isTSMethodSignature(node)) {
      const returnPath = path.get('typeAnnotation') as NodePath
      if (returnPath?.node) {
        findNestedTypes(returnPath)
      }
      const params = path.get('parameters') as NodePath[]
      params.forEach((paramPath) => {
        const ta = paramPath.get('typeAnnotation.typeAnnotation') as NodePath
        if (ta?.node) findNestedTypes(ta)
      })
    }

    // TSDeclareFunction
    if (t.isTSDeclareFunction(node)) {
      const params = path.get('params') as NodePath[]
      params.forEach((p) => {
        const ta = p.get('typeAnnotation.typeAnnotation') as NodePath
        if (ta?.node) findNestedTypes(ta)
      })
      const returnType = path.get('returnType.typeAnnotation') as NodePath
      if (returnType?.node) findNestedTypes(returnType)
    }
  }

  traverse(ast, {
    TSTypeAliasDeclaration(path) {
      const typeString = getTypingsWithoutComments(path.node.typeAnnotation)
      typeCounts.set(typeString, (typeCounts.get(typeString) || 0) + 1)

      if (typeMap.has(typeString) && (typeCounts.get(typeString) || 0) > 1) {
        const existing = typeMap.get(typeString)!
        path.replaceWith(
          t.tsTypeAliasDeclaration(path.node.id, null, t.tsTypeReference(t.identifier(existing.id.name)))
        )
      } else {
        addTypeToMap(path.node)
      }
    },
    TSPropertySignature(path) {
      const annPath = path.get('typeAnnotation.typeAnnotation') as NodePath
      if (annPath?.node) findNestedTypes(annPath)
    },
    TSFunctionType(path) {
      const returnPath = path.get('typeAnnotation') as NodePath
      if (returnPath.node) findNestedTypes(returnPath)
      const params = path.get('parameters') as NodePath[]
      params.forEach((param) => {
        const ta = param.get('typeAnnotation.typeAnnotation') as NodePath
        if (ta?.node) findNestedTypes(ta)
      })
    },
    TSMethodSignature(path) {
      const returnPath = path.get('typeAnnotation.typeAnnotation') as NodePath
      if (returnPath?.node) {
        findNestedTypes(returnPath)
      }
      const params = path.get('parameters') as NodePath[]
      params.forEach((param) => {
        const ta = param.get('typeAnnotation.typeAnnotation') as NodePath
        if (ta?.node) findNestedTypes(ta)
      })
    },
    TSDeclareFunction(path) {
      const params = path.get('params') as NodePath[]
      params.forEach((p) => {
        const ta = p.get('typeAnnotation.typeAnnotation') as NodePath
        if (ta?.node) findNestedTypes(ta)
      })
      const returnPath = path.get('returnType.typeAnnotation') as NodePath
      if (returnPath?.node) findNestedTypes(returnPath)
    },
  })

  // Hoist types that appear more than once
  typeMap.forEach((typeNode, typeString) => {
    if ((typeCounts.get(typeString) || 0) > 1) {
      if (
        !hoistedTypes.some((ht) => {
          return getTypingsWithoutComments(ht.typeAnnotation) === getTypingsWithoutComments(typeNode.typeAnnotation)
        })
      ) {
        hoistedTypes.push(typeNode)
      }
    }
  })

  // Rebuild program body with hoisted types first
  ast.program.body = [
    ...hoistedTypes,
    ...ast.program.body.filter(
      (node) => !hoistedTypes.some((ht) => t.isTSTypeAliasDeclaration(node) && node.id.name === ht.id.name)
    ),
  ]

  return ast
}

export async function hoistTypings(code: string, formatOptions?: CodeFormatOptions) {
  formatOptions ??= {}
  formatOptions.throwOnError ??= true

  for (let i = 1; i <= 5; i++) {
    try {
      const initialCode = code
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript'],
      })
      const transformedAst = extractAndHoistTypes(ast as t.File)
      code = new CodeGenerator(transformedAst, {
        // quotes: 'single',
        compact: false,
      }).generate().code
      if (initialCode === code) {
        break
      }
    } catch (err) {
      console.error(err)
      if (formatOptions.throwOnError) {
        throw new CodeFormattingError(err instanceof Error ? err.message : String(err ?? 'Unknown Error'), code)
      }
      break
    }
  }

  return formatTypings(code, formatOptions)
}
