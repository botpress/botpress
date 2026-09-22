import { walk, type AnyNode } from '../ast.js'

const DYNAMIC_GLOBALS = new Set(['eval', 'Function', 'AsyncFunction', 'GeneratorFunction', 'AsyncGeneratorFunction'])
const GLOBAL_OBJECTS = new Set(['globalThis', 'global', 'window', 'self'])
const INVOCATION_METHODS = new Set(['call', 'apply', 'bind'])

function propertyName(node: AnyNode): string | undefined {
  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name
  }

  if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
    return node.property.value
  }

  return undefined
}

function isConstructorAccess(node: AnyNode): boolean {
  return node.type === 'MemberExpression' && propertyName(node) === 'constructor'
}

function isReference(node: AnyNode, parent: AnyNode | null): boolean {
  if (!parent) {
    return true
  }

  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) {
    return false
  }

  if (parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand) {
    return false
  }

  return parent.type !== 'VariableDeclarator' || parent.id !== node
}

/**
 * Dynamically generated source bypasses the VM's control-flow instrumentation.
 * Reject identifiable entry points and constructor aliases. This is a language
 * restriction, not a security boundary against reflective JavaScript escapes.
 */
export function rejectDynamicCode(ast: AnyNode): void {
  const constructorAliases = new Set<string>()
  const globalAliases = new Set(GLOBAL_OBJECTS)
  const aliasAssignments: Array<{ name: string; value: AnyNode }> = []
  const reject = (): never => {
    throw new Error(
      'Dynamic code generation is not supported in run_javascript. Write JavaScript directly; do not use eval, Function, or async/generator function constructors.'
    )
  }

  walk(ast, (node, parent) => {
    if (node.type === 'Identifier' && DYNAMIC_GLOBALS.has(node.name) && isReference(node, parent)) {
      reject()
    }

    if (
      node.type === 'MemberExpression' &&
      node.object.type === 'Identifier' &&
      GLOBAL_OBJECTS.has(node.object.name) &&
      DYNAMIC_GLOBALS.has(propertyName(node) ?? '')
    ) {
      reject()
    }

    if (node.type === 'VariableDeclarator' && node.init) {
      if (node.id.type === 'Identifier') {
        aliasAssignments.push({ name: node.id.name, value: node.init })
      }

      if (node.id.type === 'ObjectPattern') {
        for (const property of node.id.properties) {
          const key = property.computed ? property.key?.value : (property.key?.name ?? property.key?.value)

          if (key === 'constructor' && property.value?.type === 'Identifier') {
            constructorAliases.add(property.value.name)
          }
        }
      }
    }

    if (node.type === 'AssignmentExpression' && node.left.type === 'Identifier') {
      aliasAssignments.push({ name: node.left.name, value: node.right })
    }
  })

  let changed = true
  while (changed) {
    changed = false

    for (const { name, value } of aliasAssignments) {
      const fromAlias = value.type === 'Identifier' && constructorAliases.has(value.name)

      if (!constructorAliases.has(name) && (isConstructorAccess(value) || fromAlias)) {
        constructorAliases.add(name)
        changed = true
      }

      if (value.type === 'Identifier' && globalAliases.has(value.name) && !globalAliases.has(name)) {
        globalAliases.add(name)
        changed = true
      }
    }
  }

  walk(ast, (node) => {
    if (
      node.type === 'MemberExpression' &&
      node.object.type === 'Identifier' &&
      globalAliases.has(node.object.name) &&
      DYNAMIC_GLOBALS.has(propertyName(node) ?? '')
    ) {
      reject()
    }

    if (
      node.type === 'VariableDeclarator' &&
      node.id.type === 'ObjectPattern' &&
      node.init?.type === 'Identifier' &&
      globalAliases.has(node.init.name)
    ) {
      const hasDynamicBinding = node.id.properties.some((property: AnyNode) => {
        const key = property.computed ? property.key?.value : (property.key?.name ?? property.key?.value)

        return DYNAMIC_GLOBALS.has(key)
      })

      if (hasDynamicBinding) {
        reject()
      }
    }

    if (node.type !== 'CallExpression' && node.type !== 'NewExpression') {
      return
    }

    let callee = node.callee as AnyNode
    while (callee.type === 'MemberExpression' && INVOCATION_METHODS.has(propertyName(callee) ?? '')) {
      callee = callee.object
    }

    if (isConstructorAccess(callee) || (callee.type === 'Identifier' && constructorAliases.has(callee.name))) {
      reject()
    }
  })
}
