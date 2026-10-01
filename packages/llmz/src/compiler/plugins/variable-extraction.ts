import { walk, type AnyNode, type Ctx } from '../ast.js'

export const VariableTrackingFnIdentifier = '__var__'
const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'])

function declaredNames(id: AnyNode | null): string[] {
  if (!id) return []
  if (id.type === 'Identifier') return [id.name]
  if (id.type === 'RestElement') return declaredNames(id.argument)
  if (id.type === 'AssignmentPattern') return declaredNames(id.left)
  if (id.type === 'ArrayPattern') return id.elements.flatMap(declaredNames)
  if (id.type === 'ObjectPattern') {
    return id.properties.flatMap((prop: AnyNode) =>
      declaredNames(prop.type === 'RestElement' ? prop.argument : prop.value)
    )
  }
  return []
}

/** Retain getters only for bindings visible between iterations, never local shadows. */
export function applyVariableTracking(ctx: Ctx, variables: Set<string>): void {
  const wrapper = ctx.ast.body.find(
    (node: AnyNode) => node.type === 'FunctionDeclaration' && node.id?.name === '__fn__'
  ) as AnyNode | undefined
  const root = wrapper?.body ?? ctx.ast
  const varBindings = new Set<string>()
  const track = (names: string[]) =>
    names
      .map((name) => `${VariableTrackingFnIdentifier}(${JSON.stringify(name)}, () => eval(${JSON.stringify(name)}));`)
      .join('')

  walk(root, (node, parent, ancestors) => {
    if (
      node.type !== 'VariableDeclaration' ||
      ancestors.some((ancestor) => FUNCTION_TYPES.has(ancestor.type) || ancestor.type === 'StaticBlock')
    ) {
      return
    }
    if (node.kind !== 'var' && parent !== root) return

    const names = node.declarations
      .flatMap((declaration: AnyNode) => declaredNames(declaration.id))
      .filter((name: string) => !name.startsWith('__')) as string[]
    for (const name of names) variables.add(name)
    if (node.kind === 'var' && parent !== root) {
      for (const name of names) varBindings.add(name)
    } else if (node.declarations.length > 1) {
      // Register before initialization so earlier declarators survive a later throw.
      // Drivers read these lazy getters only when execution settles.
      ctx.ms.appendLeft(node.start, track(names))
    } else {
      const semi = ctx.code[node.end - 1] === ';' ? '' : ';'
      ctx.ms.appendRight(node.end, semi + track(names))
    }
  })

  // var belongs to the execution function even inside loops or untaken branches.
  const entry = root.body.find((node: AnyNode) => !node.directive)
  if (entry && varBindings.size) ctx.ms.appendLeft(entry.start, track([...varBindings]))
}
