import chalk from 'chalk'
import { inject, injectable } from 'inversify'
import util from 'util'

import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'

@injectable()
export default class ConsoleLogger implements Logger {
  constructor(@inject(TYPES.Logger_Name) private name: string) {}

  private print(color: 'blue' | 'green' | 'yellow' | 'red', message: string, metadata: any) {
    const serializedMetadata = metadata ? ' | ' + util.inspect(metadata, false, 2, true) : ''
    console.log(chalk`{${color}.bold DEBUG [${this.name}]} ${message}${serializedMetadata}`)
  }

  debug(message: string, metadata?: any): void {
    this.print('blue', message, metadata)
  }

  info(message: string, metadata?: any): void {
    this.print('green', message, metadata)
  }

  warn(message: string, metadata?: any): void {
    this.print('yellow', message, metadata)
  }

  error(message: string, metadata?: any): void
  error(message: string, error: Error, metadata?: any): void {
    if (error instanceof Error) {
      const msg = message + ` [${error.name}, ${error.message}]`
      return this.print('red', msg, metadata)
    }

    this.print('red', message, error)
  }
}
