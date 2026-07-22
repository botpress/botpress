import { walk, type AnyNode, type Ctx } from '../ast.js'

export const VariableTrackingFnIdentifier = '__var__'

/**
 * Tracks user variables so the VM can read their values between iterations:
 * - after each variable declaration: `__var__("a", () => eval("a"));`
 * - at the top of function bodies, for their parameters
 *
 * The `eval` indirection captures the variable lazily in its own scope.
 */
export function applyVariableTracking(ctx: Ctx, variables: Set<string>): void {
  const trackerFor = (name: string): string | null => {
    if (name.startsWith('__')) {
      return null
    }
    variables.add(name)
    return `${VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => eval(${JSON.stringify(name)}));`
  }

  const track = (names: string[]): string =>
    names
      .map(trackerFor)
      .filter((t): t is string => !!t)
      .join('')

  // names declared by a `const/let/var` binding pattern
  const declaredNames = (id: AnyNode): string[] => {
    if (id.type === 'Identifier') {
      return [id.name]
    }
    if (id.type === 'ObjectPattern') {
      const names: string[] = []
      for (const prop of id.properties as AnyNode[]) {
        if (prop.type !== 'Property') {
          continue
        }
        if (prop.value.type === 'Identifier') {
          names.push(prop.value.name)
        } else if (prop.value.type === 'ObjectPattern') {
          names.push(...declaredNames(prop.value))
        } else if (prop.value.type === 'AssignmentPattern' && prop.value.left.type === 'Identifier') {
          names.push(prop.value.left.name)
        }
      }
      return names
    }
    if (id.type === 'ArrayPattern') {
      const names: string[] = []
      for (const element of id.elements as (AnyNode | null)[]) {
        if (!element) {
          continue
        }
        if (element.type === 'Identifier') {
          names.push(element.name)
        } else if (element.type === 'RestElement' && element.argument.type === 'Identifier') {
          names.push(element.argument.name)
        } else if (element.type === 'AssignmentPattern' && element.left.type === 'Identifier') {
          names.push(element.left.name)
        }
      }
      return names
    }
    return []
  }

  // names bound by function parameters (shallower rules than declarations)
  const paramNames = (params: AnyNode[]): string[] => {
    const names: string[] = []
    for (const param of params) {
      if (param.type === 'Identifier') {
        names.push(param.name)
      } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
        names.push(param.left.name)
      } else if (param.type === 'ObjectPattern') {
        for (const prop of param.properties as AnyNode[]) {
          if (prop.type === 'Property' && prop.value.type === 'Identifier') {
            names.push(prop.value.name)
          }
        }
      } else if (param.type === 'ArrayPattern') {
        for (const element of param.elements as (AnyNode | null)[]) {
          if (element?.type === 'Identifier') {
            names.push(element.name)
          }
        }
      }
    }
    return names
  }

  walk(ctx.ast, (node, parent) => {
    if (node.type === 'VariableDeclaration') {
      if (
        parent &&
        (parent.type === 'ForStatement' || parent.type === 'ForInStatement' || parent.type === 'ForOfStatement')
      ) {
        return
      }
      const trackers = track((node.declarations as AnyNode[]).flatMap((d) => declaredNames(d.id)))
      if (trackers) {
        const semi = ctx.code[node.end - 1] === ';' ? '' : ';'
        ctx.ms.appendRight(node.end, `${semi}${trackers}`)
      }
      return
    }

    if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
      const trackers = track(paramNames(node.params))
      if (!trackers) {
        return
      }
      const body = node.body as AnyNode
      if (body.type === 'BlockStatement') {
        ctx.ms.appendRight(body.start + 1, trackers)
      } else {
        // expression-bodied arrow: introduce a block so the trackers can run first
        ctx.ms.appendLeft(body.start, `{${trackers}return (`)
        ctx.ms.appendRight(body.end, `);}`)
      }
    }
  })
}
