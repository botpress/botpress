import type { CommandArgv, CommandDefinition } from '../typings'
import type commandDefinitions from '../command-definitions'
import { GlobalCommand } from './global-command'
import { readdir } from 'fs/promises'

export type ProfilesCommandDefinition = typeof commandDefinitions.profiles.subcommands.list
export class ProfilesCommand extends GlobalCommand<ProfilesCommandDefinition> {
  public async run(): Promise<void> {
    const botpressHome = process.env.BP_BOTPRESS_HOME
    if (!botpressHome) {
      console.error('BP_BOTPRESS_HOME environment variable is not set.')
      return
    }

    try {
      const files = await readdir(`${botpressHome}/.profiles`)
      files.forEach((file) => console.log(file))
    } catch (err) {
      console.error(`Failed to read directory: ${err}`)
    }
  }
}
