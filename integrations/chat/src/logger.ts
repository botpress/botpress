import chalk from 'chalk'

export type Logger = {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}
export type LogLevel = keyof Logger

export const logger: Logger = {
  debug: (message, ...args) => console.debug(`${chalk.blueBright('DEBUG')} ${message}`, ...args),
  info: (message, ...args) => console.info(`${chalk.greenBright('INFO')} ${message}`, ...args),
  warn: (message, ...args) => console.warn(`${chalk.yellowBright('WARN')} ${message}`, ...args),
  error: (message, ...args) => console.error(`${chalk.redBright('ERROR')} ${message}`, ...args),
}
