import commandDefinitions from './command-definitions'
import commandImplementations from './command-implementations'
import { GlobalCommandDefinition } from './command-implementations/global-command'
import { DefinitionSubTree, DefinitionTree, DefinitionTreeNode } from './command-tree'
import * as consts from './consts'
import type * as typings from './typings'

type ExportCommandTreeNode<D extends DefinitionTreeNode = DefinitionTreeNode> = D extends DefinitionSubTree
  ? ExportCommandTree<D['subcommands']>
  : D extends typings.CommandDefinition
    ? typings.CommandImplementation<D>
    : never

type ExportCommandTree<D extends DefinitionTree = DefinitionTree> = {
  [K in keyof D]: ExportCommandTreeNode<D[K]>
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

type ExportCommandArgv<C extends typings.CommandDefinition = typings.CommandDefinition> = Optional<
  typings.CommandArgv<C>,
  'botpressHome'
>

const exportWrapper =
  <C extends GlobalCommandDefinition>(handler: (argv: typings.CommandArgv<C>) => Promise<{ exitCode: number }>) =>
  async (argv: ExportCommandArgv<C>) => {
    return handler({ ...argv, botpressHome: argv.botpressHome ?? consts.defaultBotpressHome } as typings.CommandArgv<C>)
  }

export const commands = {
  login: exportWrapper(commandImplementations.login),
  logout: exportWrapper(commandImplementations.logout),
  bots: {
    create: exportWrapper(commandImplementations.bots.subcommands.create),
    get: exportWrapper(commandImplementations.bots.subcommands.get),
    delete: exportWrapper(commandImplementations.bots.subcommands.delete),
    list: exportWrapper(commandImplementations.bots.subcommands.list),
  },
  integrations: {
    get: exportWrapper(commandImplementations.integrations.subcommands.get),
    list: exportWrapper(commandImplementations.integrations.subcommands.list),
    delete: exportWrapper(commandImplementations.integrations.subcommands.delete),
  },
  interfaces: {
    get: exportWrapper(commandImplementations.interfaces.subcommands.get),
    list: exportWrapper(commandImplementations.interfaces.subcommands.list),
    delete: exportWrapper(commandImplementations.interfaces.subcommands.delete),
  },
  plugins: {
    get: exportWrapper(commandImplementations.plugins.subcommands.get),
    list: exportWrapper(commandImplementations.plugins.subcommands.list),
    delete: exportWrapper(commandImplementations.plugins.subcommands.delete),
  },
  init: exportWrapper(commandImplementations.init),
  generate: exportWrapper(commandImplementations.generate),
  bundle: exportWrapper(commandImplementations.bundle),
  build: exportWrapper(commandImplementations.build),
  read: exportWrapper(commandImplementations.read),
  serve: exportWrapper(commandImplementations.serve),
  deploy: exportWrapper(commandImplementations.deploy),
  add: exportWrapper(commandImplementations.add),
  dev: exportWrapper(commandImplementations.dev),
  lint: exportWrapper(commandImplementations.lint),
  chat: exportWrapper(commandImplementations.chat),
  profiles: {
    list: exportWrapper(commandImplementations.profiles.subcommands.list),
    active: exportWrapper(commandImplementations.profiles.subcommands.active),
    use: exportWrapper(commandImplementations.profiles.subcommands.use),
  },
} satisfies ExportCommandTree<typeof commandDefinitions>
