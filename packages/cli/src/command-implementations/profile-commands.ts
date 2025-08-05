import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { GlobalCache, GlobalCommand, ProfileCredentials } from './global-command'
import * as config from '../config'
import * as utils from '../utils'

export type ActiveProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.active
export class ActiveProfileCommand extends GlobalCommand<ActiveProfileCommandDefinition> {
  public async run(): Promise<void> {
    const profiles = await this.readProfilesFromFS()
    const cache = this.globalCache
    const apiUrl = await cache.get('apiUrl')
    const token = await cache.get('token')
    const workspaceId = await cache.get('workspaceId')

    //if cache is not set
    //if profile is found
    for (const [profileName, profile] of Object.entries(profiles)) {
      if (profile.apiUrl === apiUrl && profile.token === token && profile.workspaceId === workspaceId) {
        this.logger.log(`The profile ${profileName} is currently used`)
        return
      }
    }
    this.logger.log('No matching profile is currently used')
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
    this.logger.log('Available profiles:')
    for (const [profileName, profile] of Object.entries(profiles)) {
      this.logger.log(`- ${profileName}: ${JSON.stringify(profile)}`)
    }
  }
}

export type UseProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.use
export class UseProfileCommand extends GlobalCommand<UseProfileCommandDefinition> {
  public async run(): Promise<void> {
    if (this.argv.profileToUse) {
      //reading profile to make sure it exists
      const profile = await this.readProfileFromFS(this.argv.profileToUse)
      await this.globalCache.set('activeProfile', this.argv.profileToUse)
      await _updateGlobalCache({ globalCache: this.globalCache, profileName: this.argv.profileToUse, profile })
    } else {
      //TODO: interactive prompt
    }
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
