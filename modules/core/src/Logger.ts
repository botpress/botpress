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
    throw new Error('Method not implemented.')
  }
  info(message: string): void {
    throw new Error('Method not implemented.')
  }
  warn(message: string): void {
    throw new Error('Method not implemented.')
  }
  error(message: string): void {
    throw new Error('Method not implemented.')
  }
}
