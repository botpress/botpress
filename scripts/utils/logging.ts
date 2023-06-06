import chalk from 'chalk'

export type Logger = {
  info: (...messages: string[]) => void
  warn: (...messages: string[]) => void
  error: (...messages: string[]) => void
}

const { log } = console
export const logger = {
  info: (...messages: string[]) => log(chalk.green('info'), ...messages),
  warn: (...messages: string[]) => log(chalk.yellow('warn'), ...messages),
  error: (...messages: string[]) => log(chalk.red('error'), ...messages),
}
