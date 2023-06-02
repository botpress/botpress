import type commandDefinitions from '../command-definitions'
import { GlobalCommand } from './global-command'

export type LogoutCommandDefinition = typeof commandDefinitions.logout
export class LogoutCommand extends GlobalCommand<LogoutCommandDefinition> {
  public async run(): Promise<void> {
    await this.globalCache.clear()
    this.logger.success('Logged Out')
  }
}
