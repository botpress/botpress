import 'dotenv/config'
import yargs from '@bpinternal/yargs-extra'
import commandDefinitions from './command-definitions'
import commandImplementations from './command-implementations'
import * as tree from './command-tree'
import * as errors from './errors'
import { Logger } from './logger'
import * as commands from './commands'
import { registerYargs } from './register-yargs'

export const login = commands.login
export const logout = commands.logout
export const bots = commands.bots
export const integrations = commands.integrations
export const interfaces = commands.interfaces
export const plugins = commands.plugins
export const init = commands.init
export const generate = commands.generate
export const bundle = commands.bundle
export const build = commands.build
export const read = commands.read
export const serve = commands.serve
export const deploy = commands.deploy
export const add = commands.add
export const dev = commands.dev
export const lint = commands.lint
export const chat = commands.chat
export const profiles = commands.profiles

const logError = (thrown: unknown) => {
  const error = errors.BotpressCLIError.map(thrown)
  new Logger().error(error.message)
}

const onError = (thrown: unknown) => {
  logError(thrown)
  process.exit(1)
}

const yargsFail = (msg: string) => {
  logError(`${msg}\n`)
  yargs.showHelp()
  process.exit(1)
}

if (require.main === module) {
  process.on('uncaughtException', (thrown: unknown) => onError(thrown))
  process.on('unhandledRejection', (thrown: unknown) => onError(thrown))

  const commands = tree.zipTree(commandDefinitions, commandImplementations)

  registerYargs(yargs, commands)

  void yargs
    .version()
    .scriptName('bp')
    .demandCommand(1, "You didn't provide any command. Use the --help flag to see the list of available commands.")
    .recommendCommands()
    .strict()
    .help()
    .fail(yargsFail)
    .parse()
}
