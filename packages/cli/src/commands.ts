import { ApiClient } from './api/client'
import { GlobalCtor } from './command-implementations'
import { AddCommand } from './command-implementations/add-command'
import * as botsCommands from './command-implementations/bot-commands'
import { BuildCommand } from './command-implementations/build-command'
import { BundleCommand } from './command-implementations/bundle-command'
import { ChatCommand } from './command-implementations/chat-command'
import { DeployCommand } from './command-implementations/deploy-command'
import { DevCommand } from './command-implementations/dev-command'
import { GenerateCommand } from './command-implementations/gen-command'
import type { GlobalCommandDefinition } from './command-implementations/global-command'
import { InitCommand } from './command-implementations/init-command'
import * as integrationsCommands from './command-implementations/integration-commands'
import * as interfacesCommands from './command-implementations/interface-commands'
import { LintCommand } from './command-implementations/lint-command'
import { LoginCommand } from './command-implementations/login-command'
import { LogoutCommand } from './command-implementations/logout-command'
import * as pluginsCommands from './command-implementations/plugin-commands'
import * as profilesCommands from './command-implementations/profile-commands'
import { ReadCommand } from './command-implementations/read-command'
import { ServeCommand } from './command-implementations/serve-command'
import * as consts from './consts'
import { Logger } from './logger'
import type { CommandArgv, CommandDefinition } from './typings'
import * as utils from './utils'

type CommandGlobalOptions = {
  confirm?: boolean
  verbose?: boolean
  json?: boolean
  botpressHome?: string
}

type CommandArgvParams<C extends CommandDefinition = CommandDefinition> = Omit<
  CommandArgv<C>,
  'verbose' | 'confirm' | 'botpressHome' | 'json'
>

const getHandler =
  <C extends GlobalCommandDefinition>(cls: GlobalCtor<C>) =>
  async (argv: CommandArgvParams<C>, opts: CommandGlobalOptions = {}) => {
    const logger = new Logger(opts)
    const prompt = new utils.prompt.CLIPrompt({ confirm: opts.confirm ?? false }, logger)
    const args = {
      ...argv,
      confirm: opts.confirm ?? false,
      verbose: opts.verbose ?? false,
      json: opts.json ?? false,
      botpressHome: opts.botpressHome ?? consts.defaultBotpressHome,
    } as CommandArgv<C>
    return new cls(ApiClient, prompt, logger, args).handler()
  }

export const login = getHandler(LoginCommand)
export const logout = getHandler(LogoutCommand)
export const bots = {
  create: getHandler(botsCommands.CreateBotCommand),
  get: getHandler(botsCommands.GetBotCommand),
  delete: getHandler(botsCommands.DeleteBotCommand),
  list: getHandler(botsCommands.ListBotsCommand),
}
export const integrations = {
  get: getHandler(integrationsCommands.GetIntegrationCommand),
  list: getHandler(integrationsCommands.ListIntegrationsCommand),
  delete: getHandler(integrationsCommands.DeleteIntegrationCommand),
}
export const interfaces = {
  get: getHandler(interfacesCommands.GetInterfaceCommand),
  list: getHandler(interfacesCommands.ListInterfacesCommand),
  delete: getHandler(interfacesCommands.DeleteInterfaceCommand),
}
export const plugins = {
  get: getHandler(pluginsCommands.GetPluginCommand),
  list: getHandler(pluginsCommands.ListPluginsCommand),
  delete: getHandler(pluginsCommands.DeletePluginCommand),
}
export const init = getHandler(InitCommand)
export const generate = getHandler(GenerateCommand)
export const bundle = getHandler(BundleCommand)
export const build = getHandler(BuildCommand)
export const read = getHandler(ReadCommand)
export const serve = getHandler(ServeCommand)
export const deploy = getHandler(DeployCommand)
export const add = getHandler(AddCommand)
export const dev = getHandler(DevCommand)
export const lint = getHandler(LintCommand)
export const chat = getHandler(ChatCommand)
export const profiles = {
  list: getHandler(profilesCommands.ListProfilesCommand),
  active: getHandler(profilesCommands.ActiveProfileCommand),
  use: getHandler(profilesCommands.UseProfileCommand),
}
