import type commandDefinitions from '../command-definitions'
import { GlobalCommand } from './global-command'

export type ChatCommandDefinition = typeof commandDefinitions.chat
export class ChatCommand extends GlobalCommand<ChatCommandDefinition> {
  public async run(): Promise<void> {
    this.logger.success('Chat command executed')
  }
}
