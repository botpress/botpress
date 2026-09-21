import { AssignmentError, ReservedIdentifierError } from '../../errors.js'
import { RESERVED_RUNTIME_NAMES } from '../../runtime-names.js'
import { walk, type AnyNode, type Ctx } from '../ast.js'

export const VariableTrackingFnIdentifier = '__var__'
const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])
const RESERVED = RESERVED_RUNTIME_NAMES
function names(id: AnyNode | null): string[] {
  if (!id) {
    return []
  }

  if (id.type === 'Identifier') {
    return [id.name]
  }

  if (id.type === 'RestElement') {
    return names(id.argument)
  }

  if (id.type === 'AssignmentPattern') {
    return names(id.left)
  }

  if (id.type === 'ObjectPattern') {
    return id.properties.flatMap((prop: AnyNode) => names(prop.type === 'RestElement' ? prop.argument : prop.value))
  }

  if (id.type === 'ArrayPattern') {
    return id.elements.flatMap(names)
  }

  return []
}

function rootName(node: AnyNode): string | undefined {
  if (node.type === 'Identifier') {
    return node.name
  }

  if (node.type === 'MemberExpression') {
    return rootName(node.object)
  }

  return undefined
}

/** Capture only session-level bindings, and record completed writes without changing expression values. */
export function applyVariableTracking(ctx: Ctx, variables: Set<string>, deferSuffixes = false): () => void {
  const suffixes: (() => void)[] = []
  const wrapper = ctx.ast.body.find(
    (node: any) => node.type === 'FunctionDeclaration' && node.id?.name === '__fn__'
  ) as AnyNode | undefined
  const root = wrapper?.body ?? ctx.ast
  const scopes = new Map<AnyNode, Set<string>>()
  const sessionDeclarations = new Set<AnyNode>()
  const varBindings = new Set<string>()
  const scope = (node: AnyNode): Set<string> => {
    if (!scopes.has(node)) {
      scopes.set(node, new Set())
    }

    return scopes.get(node)!
  }
  const owner = (ancestors: AnyNode[], isVar = false): AnyNode =>
    [...ancestors]
      .reverse()
      .find(
        (node) =>
          node === root ||
          node.type === 'Program' ||
          node.type === 'StaticBlock' ||
          FUNCTION_TYPES.has(node.type) ||
          (!isVar &&
            (node.type === 'BlockStatement' ||
              node.type === 'SwitchStatement' ||
              node.type === 'CatchClause' ||
              node.type === 'ForStatement' ||
              node.type === 'ForOfStatement' ||
              node.type === 'ForInStatement'))
      ) ?? root
  walk(ctx.ast, (node, parent, ancestors) => {
    let declared: string[] = []
    if (node.type === 'VariableDeclarator') {
      declared = names(node.id)
      const bindingScope = owner(ancestors, parent?.kind === 'var')
      for (const name of declared) {
        scope(bindingScope).add(name)
      }

      if (bindingScope === root) {
        sessionDeclarations.add(node)
        for (const name of declared.filter((name) => !name.startsWith('__'))) {
          variables.add(name)
          if (parent?.kind === 'var') {
            varBindings.add(name)
          }
        }
      }
    } else if (FUNCTION_TYPES.has(node.type)) {
      declared = node.params.flatMap(names)
      if (node.id) {
        declared.push(node.id.name)
      }

      for (const name of declared) {
        scope(node).add(name)
      }
    } else if (node.type === 'CatchClause' && node.param) {
      declared = names(node.param)
      for (const name of declared) {
        scope(node).add(name)
      }
    }

    for (const name of declared) {
      if (RESERVED.has(name)) {
        throw new ReservedIdentifierError(name, 'variable', false, `${name} is reserved for runtime memory`)
      }
    }
  })
  const eligible = (name: string, ancestors: AnyNode[]): boolean => {
    if (name.startsWith('__')) {
      return false
    }

    for (const ancestor of [...ancestors].reverse()) {
      if (ancestor === root) {
        return true
      }

      if (scopes.get(ancestor)?.has(name)) {
        return false
      }
    }

    return true
  }
  const wrap = (node: AnyNode, bindingNames: string[], kind: 'assignment' | 'mutation' = 'assignment') => {
    if (!bindingNames.length) {
      return
    }

    // This helper returns its third argument unchanged, including postfix update values.
    ctx.ms.appendLeft(
      node.start,
      bindingNames
        .map(
          (name) => `${VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => eval(${JSON.stringify(name)}), (`
        )
        .join('')
    )
    suffixes.unshift(() => ctx.ms.appendRight(node.end, bindingNames.map(() => `), ${JSON.stringify(kind)})`).join('')))
  }

  // A var binding exists throughout the function, even when its declaration is
  // in an untaken branch or has no initializer. Capture it from the root scope
  // without reporting a write or inserting statements into a loop header.
  const varGetters = [...varBindings]
    .map(
      (name) =>
        `${VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => eval(${JSON.stringify(name)}), undefined, "initialize");`
    )
    .join('')
  const entry = root.body.find((node: AnyNode) => !node.directive)
  if (entry && varGetters) {
    ctx.ms.appendLeft(entry.start, varGetters)
  }

  walk(ctx.ast, (node, parent, ancestors) => {
    if (node.type === 'VariableDeclaration' && parent === root && node.kind !== 'var') {
      const declared = node.declarations
        .flatMap((declaration: AnyNode) => names(declaration.id))
        .filter((name: string) => variables.has(name))
      ctx.ms.appendLeft(
        node.start,
        declared
          .map(
            (name: string) =>
              `${VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => eval(${JSON.stringify(name)}), undefined, "initialize");`
          )
          .join('')
      )
    }

    if (node.type === 'VariableDeclarator' && sessionDeclarations.has(node)) {
      const declared = names(node.id).filter((name) => variables.has(name) && eligible(name, ancestors))
      if (node.init) {
        wrap(node.init, declared)
      } else if (parent && parent.kind !== 'var') {
        const trackers = declared
          .map(
            (name) => `${VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => eval(${JSON.stringify(name)}));`
          )
          .join('')
        ctx.ms.appendRight(parent.end, `${ctx.code[parent.end - 1] === ';' ? '' : ';'}${trackers}`)
      }
    }

    if (
      (node.type === 'ForOfStatement' || node.type === 'ForInStatement') &&
      node.left.type === 'VariableDeclaration'
    ) {
      const declared = node.left.declarations
        .filter((declaration: AnyNode) => sessionDeclarations.has(declaration))
        .flatMap((declaration: AnyNode) => names(declaration.id))
        .filter((name: string) => eligible(name, ancestors))
      if (declared.length) {
        // The loop assigns its binding before entering the body. An extra block
        // keeps single statements, labels, continue and break semantics intact.
        const trackers = declared
          .map(
            (name: string) =>
              `${VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => eval(${JSON.stringify(name)}));`
          )
          .join('')
        ctx.ms.appendLeft(node.body.start, `{${trackers}`)
        suffixes.unshift(() => ctx.ms.appendRight(node.body.end, '}'))
      }
    }

    if (
      node.type === 'AssignmentExpression' ||
      node.type === 'UpdateExpression' ||
      (node.type === 'UnaryExpression' && node.operator === 'delete')
    ) {
      const target = node.left ?? node.argument
      const roots =
        target.type === 'MemberExpression' ? ([rootName(target)].filter(Boolean) as string[]) : names(target)
      for (const name of roots) {
        if (RESERVED.has(name)) {
          throw new AssignmentError(`${name} is read-only runtime memory`)
        }
      }

      const tracked = [...new Set(roots)].filter((name) => eligible(name, ancestors))
      const kind = target.type === 'MemberExpression' ? 'mutation' : 'assignment'
      const logicalAssignment = ['||=', '&&=', '??='].includes(node.operator)
      if (logicalAssignment) {
        // Track only the branch that actually writes. Reusing an identifier is side-effect free.
        if (target.type === 'Identifier' && tracked.length) {
          const name = tracked[0]!
          const operator = node.operator.slice(0, -1)
          const lineBreaks = ctx.code.slice(target.end, node.right.start).replace(/[^\n]/g, '')
          ctx.ms.appendLeft(node.start, '(')
          ctx.ms.overwrite(target.end, node.right.start, ` ${operator} ${lineBreaks}`)
          ctx.ms.appendLeft(
            node.right.start,
            `${VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => eval(${JSON.stringify(name)}), (${name} = (`
          )
          suffixes.unshift(() => ctx.ms.appendRight(node.end, `)), "assignment"))`))
        }

        // Complex member targets can have getter side effects; their changes are observed at settlement.
        return
      }

      wrap(node, tracked, kind)
    }
  })
  const finish = () => suffixes.forEach((apply) => apply())
  if (!deferSuffixes) {
    finish()
  }

  return finish
}
