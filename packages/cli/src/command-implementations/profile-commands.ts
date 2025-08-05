import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { GlobalCommand } from './global-command'

export type GetProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.get
export class GetProfileCommand extends GlobalCommand<GetProfileCommandDefinition> {
  public async run(): Promise<void> {}
}

export type ListProfilesCommandDefinition = typeof commandDefinitions.profiles.subcommands.list
export class ListProfilesCommand extends GlobalCommand<ListProfilesCommandDefinition> {
  public async run(): Promise<void> {}
}

export type SetProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.set
export class SetProfileCommand extends GlobalCommand<SetProfileCommandDefinition> {
  public async run(): Promise<void> {}
}
