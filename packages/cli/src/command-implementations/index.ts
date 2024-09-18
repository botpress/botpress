import { ApiClient } from '../api/client'
import type commandDefinitions from '../command-definitions'
import type { ImplementationTree } from '../command-tree'
import { Logger } from '../logger'
import type { CommandArgv } from '../typings'
import * as utils from '../utils'
import { AddCommand } from './add-command'
import type { BaseCommand } from './base-command'
import * as bots from './bot-commands'
import { BuildCommand } from './build-command'
import { BundleCommand } from './bundle-command'
import { DeployCommand } from './deploy-command'
import { DevCommand } from './dev-command'
import { GenerateCommand } from './gen-command'
import type { GlobalCommand, GlobalCommandDefinition } from './global-command'
import { InitCommand } from './init-command'
import * as integrations from './integration-commands'
import * as interfaces from './interface-commands'
import { LoginCommand } from './login-command'
import { LogoutCommand } from './logout-command'
import { ReadCommand } from './read-command'
import { ServeCommand } from './serve-command'

type GlobalCtor<C extends GlobalCommandDefinition> = new (
  ...args: ConstructorParameters<typeof GlobalCommand<C>>
) => BaseCommand<C>

const getHandler =
  <C extends GlobalCommandDefinition>(cls: GlobalCtor<C>) =>
  async (argv: CommandArgv<C>) => {
    const logger = new Logger(argv)
    const prompt = new utils.prompt.CLIPrompt(argv, logger)
    return new cls(ApiClient, prompt, logger, argv).handler()
  }

export default {
  login: getHandler(LoginCommand),
  logout: getHandler(LogoutCommand),
  bots: {
    subcommands: {
      create: getHandler(bots.CreateBotCommand),
      get: getHandler(bots.GetBotCommand),
      delete: getHandler(bots.DeleteBotCommand),
      list: getHandler(bots.ListBotsCommand),
    },
  },
  integrations: {
    subcommands: {
      get: getHandler(integrations.GetIntegrationCommand),
      list: getHandler(integrations.ListIntegrationsCommand),
      delete: getHandler(integrations.DeleteIntegrationCommand),
    },
  },
  interfaces: {
    subcommands: {
      get: getHandler(interfaces.GetInterfaceCommand),
      list: getHandler(interfaces.ListInterfacesCommand),
      delete: getHandler(interfaces.DeleteInterfaceCommand),
    },
  },
  init: getHandler(InitCommand),
  generate: getHandler(GenerateCommand),
  bundle: getHandler(BundleCommand),
  build: getHandler(BuildCommand),
  read: getHandler(ReadCommand),
  serve: getHandler(ServeCommand),
  deploy: getHandler(DeployCommand),
  add: getHandler(AddCommand),
  dev: getHandler(DevCommand),
} satisfies ImplementationTree<typeof commandDefinitions>
