import * as client from '@botpress/client'
import chalk from 'chalk'
import * as fs from 'fs'
import * as paging from '../api/paging'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as utils from '../utils'
import { GlobalCache, GlobalCommand, ProfileCredentials } from './global-command'

type ProfileEntry = ProfileCredentials & {
  name: string
}

export type ActiveProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.active
export class ActiveProfileCommand extends GlobalCommand<ActiveProfileCommandDefinition> {
  public async run(): Promise<void> {
    let activeProfileName = await this.globalCache.get('activeProfile')

    if (!activeProfileName) {
      this.logger.debug(`No active profile set, defaulting to ${consts.defaultProfileName}`)
      activeProfileName = consts.defaultProfileName
      await this.globalCache.set('activeProfile', activeProfileName)
    }

    const profile = await this.readProfileFromFS(activeProfileName)
    const profileEntry: ProfileEntry = { name: activeProfileName, ...profile }

    this.logger.log('Active profile:')
    this.logger.json(profileEntry)
  }
}

export type ListProfilesCommandDefinition = typeof commandDefinitions.profiles.subcommands.list
export class ListProfilesCommand extends GlobalCommand<ListProfilesCommandDefinition> {
  public async run(): Promise<void> {
    const profiles = await this.readProfilesFromFS()
    const profileEntries: ProfileEntry[] = Object.entries(profiles).map(([name, profile]) => ({ name, ...profile }))
    if (!profileEntries.length) {
      this.logger.log('No profiles found')
      return
    }
    const activeProfileName = await this.globalCache.get('activeProfile')
    this.logger.log(`Active profile: '${chalk.bold(activeProfileName)}'`)
    this.logger.json(profileEntries)
  }
}

export type UseProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.use
export class UseProfileCommand extends GlobalCommand<UseProfileCommandDefinition> {
  public async run(): Promise<void> {
    const logSuccess = (profileName: string) => this.logger.success(`Now using profile "${profileName}"`)

    if (this.argv.profileToUse) {
      const profile = await this.readProfileFromFS(this.argv.profileToUse)
      await this.globalCache.set('activeProfile', this.argv.profileToUse)
      await _updateGlobalCache({ globalCache: this.globalCache, profileName: this.argv.profileToUse, profile })
      logSuccess(this.argv.profileToUse)
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
    logSuccess(selectedProfile)
  }
}

export type AddProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.add
export class AddProfileCommand extends GlobalCommand<AddProfileCommandDefinition> {
  public async run(): Promise<void> {
    let profileName = this.argv.profileName
    if (!profileName) {
      profileName = await this.prompt.text('Enter the profile name', {})
      if (!profileName) {
        throw new errors.ParamRequiredError('Profile name')
      }
    }

    let profileExists = false
    if (fs.existsSync(this.globalPaths.abs.profilesPath)) {
      try {
        const profiles = await this.readProfilesFromFS()
        profileExists = profiles[profileName] !== undefined
      } catch {
        profileExists = false
      }
    }

    if (profileExists) {
      const overwrite = await this.prompt.confirm(
        `Profile "${profileName}" already exists. Do you want to overwrite it?`
      )
      if (!overwrite) {
        throw new errors.AbortedOperationError()
      }
    }

    let apiUrl: string
    if (this.argv.dev) {
      if (this.argv.apiUrl) {
        this.logger.warn('Both --dev and --apiUrl are specified. --dev flag will override --apiUrl.')
      }
      apiUrl = `https://api.${consts.stagingBotpressDomain}`
      this.logger.log(`Using dev environment: ${apiUrl}`, { prefix: '🔗' })
    } else {
      apiUrl = this.argv.apiUrl ?? (await this.globalCache.get('apiUrl')) ?? consts.defaultBotpressApiUrl
      if (apiUrl !== consts.defaultBotpressApiUrl) {
        this.logger.log(`Using custom API URL: ${apiUrl}`, { prefix: '🔗' })
      }
    }

    const token = await this.globalCache.sync('token', this.argv.token, async (previousToken) => {
      const prompted = await this.prompt.text('Enter your Personal Access Token', {
        initial: previousToken,
      })
      if (!prompted) {
        throw new errors.ParamRequiredError('Personal Access Token')
      }
      return prompted
    })

    const workspaceId = await this.globalCache.sync('workspaceId', this.argv.workspaceId, async (defaultId) => {
      const tmpClient = new client.Client({ apiUrl, token })
      const userWorkspaces = await paging
        .listAllPages(tmpClient.listWorkspaces, (r) => r.workspaces)
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, 'Could not list workspaces')
        })

      if (userWorkspaces.length === 0) {
        throw new errors.NoWorkspacesFoundError()
      }

      const initial = userWorkspaces.find((ws) => ws.id === defaultId)

      const prompted = await this.prompt.select('Which workspace do you want to use?', {
        initial: initial && { title: initial.name, value: initial.id },
        choices: userWorkspaces.map((ws) => ({ title: ws.name, value: ws.id })),
      })

      if (!prompted) {
        throw new errors.ParamRequiredError('Workspace ID')
      }

      return prompted
    })

    // Validate credentials by testing login
    const testClient = this.api.newClient({ apiUrl, token, workspaceId }, this.logger)
    try {
      await testClient.testLogin()
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(
        thrown,
        'Failed to validate credentials. Please check your token and workspace ID.'
      )
    }

    const profile: ProfileCredentials = {
      apiUrl,
      token,
      workspaceId,
    }

    await this.writeProfileToFS(profileName, profile)

    this.logger.success(`Profile "${profileName}" added successfully`)
    await this.globalCache.set('activeProfile', profileName)
  }
}

export type DeleteProfileCommandDefinition = typeof commandDefinitions.profiles.subcommands.delete
export class DeleteProfileCommand extends GlobalCommand<DeleteProfileCommandDefinition> {
  public async run(): Promise<void> {
    let profileName = this.argv.profileToDelete
    if (!profileName) {
      const profiles = await this.readProfilesFromFS()
      const choices = Object.entries(profiles).map(([name, _]) => ({
        title: name,
        description: '',
        value: name,
      }))
      const selectedProfile = await this.prompt.select('Select the profile you want to delete.', { choices })

      if (!selectedProfile) {
        this.logger.log('No profile selected, aborting.')
        return
      }

      profileName = selectedProfile
    }

    let profiles: Record<string, ProfileCredentials>
    try {
      profiles = await this.readProfilesFromFS()
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not read profiles')
    }

    if (!profiles[profileName]) {
      throw new errors.BotpressCLIError(`Profile "${profileName}" not found`)
    }

    const activeProfileName = await this.globalCache.get('activeProfile')
    const isActive = activeProfileName === profileName

    if (isActive) {
      this.logger.warn(`Profile "${profileName}" is currently active.`)
    }

    if (profileName === consts.defaultProfileName) {
      const confirm = await this.prompt.confirm(
        `Profile "${profileName}" is the default profile. Are you sure you want to delete it?`
      )
      if (!confirm) {
        throw new errors.AbortedOperationError()
      }
    } else if (!this.argv.confirm) {
      const confirm = await this.prompt.confirm(`Are you sure you want to delete profile "${profileName}"?`)
      if (!confirm) {
        throw new errors.AbortedOperationError()
      }
    }

    delete profiles[profileName]

    await fs.promises.writeFile(this.globalPaths.abs.profilesPath, JSON.stringify(profiles, null, 2), 'utf-8')

    if (isActive) {
      await this.globalCache.set('activeProfile', '')
      this.logger.warn('Active profile has been cleared. Use "bp profiles use" to set a new active profile.')
    }

    this.logger.success(`Profile "${profileName}" deleted successfully`)
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
