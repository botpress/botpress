import { injectable } from 'inversify'
import { Logger } from './misc/interfaces'

@injectable()
export default class ConsoleLogger implements Logger {
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
