import commandDefinitions from './command-definitions'
import commandImplementations from './command-implementations'
import { DefinitionSubTree, DefinitionTree, DefinitionTreeNode } from './command-tree'
import type * as typings from './typings'

type CommandHandlersNode<D extends DefinitionTreeNode = DefinitionTreeNode> = D extends DefinitionSubTree
  ? CommandHandlers<D['subcommands']>
  : D extends typings.CommandDefinition
    ? typings.CommandImplementation<D>
    : never

type CommandHandlers<D extends DefinitionTree = DefinitionTree> = {
  [K in keyof D]: CommandHandlersNode<D[K]>
}

export default {
  login: commandImplementations.login,
  logout: commandImplementations.logout,
  bots: {
    create: commandImplementations.bots.subcommands.create,
    get: commandImplementations.bots.subcommands.get,
    delete: commandImplementations.bots.subcommands.delete,
    list: commandImplementations.bots.subcommands.list,
  },
  integrations: {
    get: commandImplementations.integrations.subcommands.get,
    list: commandImplementations.integrations.subcommands.list,
    delete: commandImplementations.integrations.subcommands.delete,
  },
  interfaces: {
    get: commandImplementations.interfaces.subcommands.get,
    list: commandImplementations.interfaces.subcommands.list,
    delete: commandImplementations.interfaces.subcommands.delete,
  },
  plugins: {
    get: commandImplementations.plugins.subcommands.get,
    list: commandImplementations.plugins.subcommands.list,
    delete: commandImplementations.plugins.subcommands.delete,
  },
  init: commandImplementations.init,
  generate: commandImplementations.generate,
  bundle: commandImplementations.bundle,
  build: commandImplementations.build,
  read: commandImplementations.read,
  serve: commandImplementations.serve,
  deploy: commandImplementations.deploy,
  add: commandImplementations.add,
  remove: commandImplementations.remove,
  dev: commandImplementations.dev,
  lint: commandImplementations.lint,
  chat: commandImplementations.chat,
  profiles: {
    list: commandImplementations.profiles.subcommands.list,
    active: commandImplementations.profiles.subcommands.active,
    use: commandImplementations.profiles.subcommands.use,
  },
} satisfies CommandHandlers<typeof commandDefinitions>
