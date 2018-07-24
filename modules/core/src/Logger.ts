import chalk from 'chalk'
import { injectable, inject } from 'inversify'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'

@injectable()
export default class ConsoleLogger implements Logger {
  private _name: string

  constructor(@inject(TYPES.Logger_Name) name: string) {
    this._name = name
  }

  debug(message: string): void {
    console.log(chalk`{blue.bold DEBUG} ${message}`)
  }
  info(message: string): void {
    console.log(chalk`{green.bold INFO} ${message}`)
  }
  warn(message: string): void {
    console.log(chalk`{yellow.bold WARN} ${message}`)
  }
  error(message: string): void {
    console.log(chalk`{red.bold ERROR} ${message}`)
  }
}
