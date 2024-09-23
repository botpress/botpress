import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { ProjectCommand } from './project-command'

export type AddCommandDefinition = typeof commandDefinitions.add
export class AddCommand extends ProjectCommand<AddCommandDefinition> {
  public async run(): Promise<void> {
    throw new errors.BotpressCLIError('Command temporarily unavailable')
  }
}
