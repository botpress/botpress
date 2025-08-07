import chalk from 'chalk'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as utils from '../utils'
import { GlobalCache, GlobalCommand, ProfileCredentials } from './global-command'

export type ActiveProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.active
export class ActiveProfileCommand extends GlobalCommand<ActiveProfileCommandDefinition> {
  public async run(): Promise<void> {
    let activeProfileName = await this.globalCache.get('activeProfile')

    if (!activeProfileName) {
      this.logger.log(`No active profile set, defaulting to ${consts.defaultProfileName}`)
      activeProfileName = consts.defaultProfileName
      await this.globalCache.set('activeProfile', activeProfileName)
    }

    const profile = await this.readProfileFromFS(activeProfileName)
    this.logger.log('Active profile:')
    this.logger.json({ [activeProfileName]: profile })
  }
}

export type ListProfilesCommandDefinition = typeof commandDefinitions.profiles.subcommands.list
export class ListProfilesCommand extends GlobalCommand<ListProfilesCommandDefinition> {
  public async run(): Promise<void> {
    const profiles = await this.readProfilesFromFS()
    if (Object.keys(profiles).length === 0) {
      this.logger.log('No profiles found')
      return
    }
    const activeProfileName = await this.globalCache.get('activeProfile')
    const profileNames = Object.keys(profiles)
    this.logger.log(`Active profile: '${chalk.bold(activeProfileName)}'`)
    this.logger.json(profileNames)
  }
}

export type UseProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.use
export class UseProfileCommand extends GlobalCommand<UseProfileCommandDefinition> {
  public async run(): Promise<void> {
    if (this.argv.profileToUse) {
      const profile = await this.readProfileFromFS(this.argv.profileToUse)
      await this.globalCache.set('activeProfile', this.argv.profileToUse)
      await _updateGlobalCache({ globalCache: this.globalCache, profileName: this.argv.profileToUse, profile })
      return
    }
    const profiles = await this.readProfilesFromFS()
    const choices = Object.entries(profiles).map(([profileName, _]) => ({
      title: profileName,
      description: '',
      value: profileName,
    }))
    const selectedProfile = await this.prompt.select('Select the profile you want to use.', { choices })

    if (!selectedProfile) {
      this.logger.log('No profile selected, aborting.')
      return
    }

    const profile = profiles[selectedProfile]
    if (!profile) throw new errors.BotpressCLIError('The selected profile could not be read')
    await this.globalCache.set('activeProfile', selectedProfile)
    await _updateGlobalCache({ globalCache: this.globalCache, profileName: selectedProfile, profile })
  }
}

const _updateGlobalCache = async (props: {
  globalCache: utils.cache.FSKeyValueCache<GlobalCache>
  profileName: string
  profile: ProfileCredentials
}): Promise<void> => {
  await props.globalCache.set('activeProfile', props.profileName)
  await props.globalCache.set('apiUrl', props.profile.apiUrl)
  await props.globalCache.set('token', props.profile.token)
  await props.globalCache.set('workspaceId', props.profile.workspaceId)
}
