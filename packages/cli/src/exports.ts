import commandDefinitions from './command-definitions'
import commands from './command-implementations'
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

export const defaultOptions = () => ({
  json: false,
  verbose: false,
  confirm: false,
  botpressHome: consts.defaultBotpressHome,
})

export default {
  login: commands.login,
  logout: commands.logout,
  bots: {
    create: commands.bots.subcommands.create,
    get: commands.bots.subcommands.get,
    delete: commands.bots.subcommands.delete,
    list: commands.bots.subcommands.list,
  },
  integrations: {
    get: commands.integrations.subcommands.get,
    list: commands.integrations.subcommands.list,
    delete: commands.integrations.subcommands.delete,
  },
  interfaces: {
    get: commands.interfaces.subcommands.get,
    list: commands.interfaces.subcommands.list,
    delete: commands.interfaces.subcommands.delete,
  },
  plugins: {
    get: commands.plugins.subcommands.get,
    list: commands.plugins.subcommands.list,
    delete: commands.plugins.subcommands.delete,
  },
  init: commands.init,
  generate: commands.generate,
  bundle: commands.bundle,
  build: commands.build,
  read: commands.read,
  serve: commands.serve,
  deploy: commands.deploy,
  add: commands.add,
  dev: commands.dev,
  lint: commands.lint,
  chat: commands.chat,
  profiles: {
    list: commands.profiles.subcommands.list,
    active: commands.profiles.subcommands.active,
    use: commands.profiles.subcommands.use,
  },
} satisfies ExportCommandTree<typeof commandDefinitions>
