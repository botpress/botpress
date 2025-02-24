import 'dotenv/config'
import yargs from '@bpinternal/yargs-extra'
import { devCommand } from './commands'

const onError = (thrown: unknown) => {
  console.error(thrown)
  process.exit(1)
}

const yargsFail = (msg: string) => {
  console.error(`${msg}\n`)
  yargs.showHelp()
  process.exit(1)
}

process.on('uncaughtException', (thrown: unknown) => onError(thrown))
process.on('unhandledRejection', (thrown: unknown) => onError(thrown))

yargs.command('dev', 'Starts an agent in development mode', devCommand)

void yargs
  .version()
  .scriptName('bp')
  .demandCommand(1, "You didn't provide any command. Use the --help flag to see the list of available commands.")
  .recommendCommands()
  .strict()
  .help()
  .fail(yargsFail)
  .parse()
