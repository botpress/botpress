import { parse, type Expression, type Pattern } from 'acorn'

import type { Assignment } from './compiler/plugins/track-tool-calls.js'
import { cloneMemoryValue, type MemoryValue } from './memory.js'

/**
 * Restore a suspended assignment without evaluating generated code on the host.
 * Arbitrary default expressions belong in the next VM execution, not resolve().
 */
export function restoreSnapshotAssignment(assignment: Assignment, rawValue: unknown): Record<string, MemoryValue> {
  const patternSource = assignment.type === 'array' ? `[${assignment.left}]` : assignment.left
  const program = parse(`let ${patternSource} = __snapshot_value;`, { ecmaVersion: 'latest' })
  const declaration = program.body[0]

  if (
    program.body.length !== 1 ||
    declaration?.type !== 'VariableDeclaration' ||
    declaration.declarations.length !== 1
  ) {
    throw new Error('The snapshot does not contain a supported assignment pattern')
  }

  const declarator = declaration.declarations[0]!

  if (declarator.init?.type !== 'Identifier' || declarator.init.name !== '__snapshot_value') {
    throw new Error('The snapshot assignment initializer is invalid')
  }

  const result = new Map<string, MemoryValue>()
  bindPattern(declarator.id, cloneMemoryValue(rawValue), result)

  return Object.fromEntries(result)
}

function bindPattern(pattern: Pattern, value: MemoryValue, bindings: Map<string, MemoryValue>): void {
  switch (pattern.type) {
    case 'Identifier': {
      bindings.set(pattern.name, value)

      return
    }

    case 'AssignmentPattern': {
      const assigned = value === undefined ? readLiteralDefault(pattern.right) : value
      bindPattern(pattern.left, assigned, bindings)

      return
    }

    case 'RestElement': {
      bindPattern(pattern.argument, value, bindings)

      return
    }

    case 'ArrayPattern': {
      if (!Array.isArray(value) && typeof value !== 'string') {
        throw new Error('Snapshot array destructuring requires an array or string')
      }

      const items = typeof value === 'string' ? Array.from(value) : value

      for (const [index, child] of pattern.elements.entries()) {
        if (!child) {
          continue
        }

        const assigned = child.type === 'RestElement' ? items.slice(index) : items[index]
        bindPattern(child, assigned, bindings)
      }

      return
    }

    case 'ObjectPattern': {
      if (value === null || value === undefined) {
        throw new Error('Snapshot object destructuring cannot read null or undefined')
      }

      const source = Object(value) as Record<string, MemoryValue>
      const consumed = new Set<string>()

      for (const property of pattern.properties) {
        if (property.type === 'RestElement') {
          const remainder = Object.fromEntries(Object.entries(source).filter(([key]) => !consumed.has(key)))
          bindPattern(property.argument, remainder, bindings)
          continue
        }

        const key = propertyKey(property.key, property.computed)
        consumed.add(key)
        const assigned = Object.hasOwn(source, key) ? source[key] : undefined
        bindPattern(property.value, assigned, bindings)
      }

      return
    }

    default: {
      throw new Error(`Snapshot assignment ${pattern.type} must be completed in the JavaScript VM`)
    }
  }
}

function propertyKey(key: Expression, computed: boolean): string {
  if (!computed && key.type === 'Identifier') {
    return key.name
  }

  const value = readLiteralDefault(key)

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  throw new Error('Snapshot computed property keys must be literal strings or numbers')
}

function readLiteralDefault(expression: Expression): MemoryValue {
  switch (expression.type) {
    case 'Literal': {
      return cloneMemoryValue(expression.value)
    }

    case 'Identifier': {
      if (expression.name === 'undefined') {
        return undefined
      }

      break
    }

    case 'UnaryExpression': {
      const value = readLiteralDefault(expression.argument)

      if (typeof value === 'number' && expression.operator === '-') {
        return -value
      }

      if (typeof value === 'number' && expression.operator === '+') {
        return value
      }

      break
    }

    case 'ArrayExpression': {
      return expression.elements.map((element) => {
        if (!element || element.type === 'SpreadElement') {
          throw new Error('Snapshot array defaults cannot contain holes or spreads')
        }

        return readLiteralDefault(element)
      })
    }

    case 'ObjectExpression': {
      const entries = expression.properties.map((property): [string, MemoryValue] => {
        if (property.type !== 'Property' || property.kind !== 'init' || property.method) {
          throw new Error('Snapshot object defaults must contain literal data properties')
        }

        return [propertyKey(property.key, property.computed), readLiteralDefault(property.value)]
      })

      return Object.fromEntries(entries)
    }
  }

  throw new Error('Snapshot default expressions must be literal data; finish this assignment in the JavaScript VM')
}
