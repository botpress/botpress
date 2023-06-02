import type * as typings from './typings'

export type DefinitionSubTree = {
  description: string
  subcommands: DefinitionTree
}

export type DefinitionTree = {
  [key: string]: DefinitionTreeNode
}

export type DefinitionTreeNode = typings.CommandDefinition | DefinitionSubTree

export type ImplementationSubTree<D extends DefinitionSubTree = DefinitionSubTree> = {
  subcommands: ImplementationTree<D['subcommands']>
}

export type ImplementationTreeNode<N extends DefinitionTreeNode = DefinitionTreeNode> =
  N extends typings.CommandDefinition
    ? typings.CommandImplementation<N>
    : N extends DefinitionSubTree
    ? ImplementationSubTree<N>
    : never

export type ImplementationTree<D extends DefinitionTree = DefinitionTree> = {
  [K in keyof D]: ImplementationTreeNode<D[K]>
}

export type CommandSubTree<D extends DefinitionSubTree = DefinitionSubTree> = {
  description: string
  subcommands: CommandTree<D['subcommands']>
}

export type CommandTreeNode<N extends DefinitionTreeNode = DefinitionTreeNode> = N extends typings.CommandDefinition
  ? typings.CommandLeaf<N>
  : N extends DefinitionSubTree
  ? CommandSubTree<N>
  : never

export type CommandTree<D extends DefinitionTree = DefinitionTree> = {
  [K in keyof D]: CommandTreeNode<D[K]>
}

export const guards = {
  definition: {
    isDef: (x: DefinitionTreeNode): x is typings.CommandDefinition => 'schema' in x,
    isSubTree: (x: DefinitionTreeNode): x is DefinitionSubTree => 'subcommands' in x,
  },
  implementation: {
    isImpl: (x: ImplementationTreeNode): x is typings.CommandImplementation => typeof x === 'function',
    isSubTree: (x: ImplementationTreeNode): x is ImplementationSubTree => typeof x === 'object',
  },
  command: {
    isLeaf: (x: CommandTreeNode): x is typings.CommandLeaf => 'handler' in x,
    isSubTree: (x: CommandTreeNode): x is CommandSubTree => 'subcommands' in x,
  },
}

export const zipTree = <T extends DefinitionTree>(defTree: T, implTree: ImplementationTree<T>): CommandTree<T> => {
  const tree = {} as CommandTree<T>

  for (const key in defTree) {
    const def = defTree[key]!
    const impl = implTree[key]!

    if (guards.definition.isDef(def) && guards.implementation.isImpl(impl)) {
      tree[key] = { ...def, handler: impl } as CommandTreeNode<typeof def>
      continue
    }

    if (guards.definition.isSubTree(def) && guards.implementation.isSubTree(impl)) {
      tree[key] = { ...def, subcommands: zipTree(def.subcommands, impl.subcommands) } as CommandTreeNode<typeof def>
      continue
    }
  }

  return tree
}
