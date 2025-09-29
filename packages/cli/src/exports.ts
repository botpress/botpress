import commandDefinitions from './command-definitions'
import commands from './command-implementations'
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

export default {
  login: exportWrapper(commands.login),
  logout: exportWrapper(commands.logout),
  bots: {
    create: exportWrapper(commands.bots.subcommands.create),
    get: exportWrapper(commands.bots.subcommands.get),
    delete: exportWrapper(commands.bots.subcommands.delete),
    list: exportWrapper(commands.bots.subcommands.list),
  },
  integrations: {
    get: exportWrapper(commands.integrations.subcommands.get),
    list: exportWrapper(commands.integrations.subcommands.list),
    delete: exportWrapper(commands.integrations.subcommands.delete),
  },
  interfaces: {
    get: exportWrapper(commands.interfaces.subcommands.get),
    list: exportWrapper(commands.interfaces.subcommands.list),
    delete: exportWrapper(commands.interfaces.subcommands.delete),
  },
  plugins: {
    get: exportWrapper(commands.plugins.subcommands.get),
    list: exportWrapper(commands.plugins.subcommands.list),
    delete: exportWrapper(commands.plugins.subcommands.delete),
  },
  init: exportWrapper(commands.init),
  generate: exportWrapper(commands.generate),
  bundle: exportWrapper(commands.bundle),
  build: exportWrapper(commands.build),
  read: exportWrapper(commands.read),
  serve: exportWrapper(commands.serve),
  deploy: exportWrapper(commands.deploy),
  add: exportWrapper(commands.add),
  dev: exportWrapper(commands.dev),
  lint: exportWrapper(commands.lint),
  chat: exportWrapper(commands.chat),
  profiles: {
    list: exportWrapper(commands.profiles.subcommands.list),
    active: exportWrapper(commands.profiles.subcommands.active),
    use: exportWrapper(commands.profiles.subcommands.use),
  },
} satisfies ExportCommandTree<typeof commandDefinitions>
