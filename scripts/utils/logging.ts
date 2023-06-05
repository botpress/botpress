import chalk from 'chalk'

export type Logger = {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

const { log } = console
export const logger = {
  info: (message: string) => log(chalk.green('info'), message),
  warn: (message: string) => log(chalk.yellow('warn'), message),
  error: (message: string) => log(chalk.red('error'), message),
}
