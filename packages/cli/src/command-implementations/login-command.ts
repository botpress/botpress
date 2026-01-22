import * as client from '@botpress/client'
import * as fs from 'fs'
import * as paging from '../api/paging'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import { getStrings, interpolate } from '../locales'
import { GlobalCommand } from './global-command'

export type LoginCommandDefinition = typeof commandDefinitions.login
export class LoginCommand extends GlobalCommand<LoginCommandDefinition> {
  public async run(): Promise<void> {
    const t = getStrings()
    let profileName = consts.defaultProfileName
    if (this.argv.profile) {
      let profileExists: boolean = false
      if (fs.existsSync(this.globalPaths.abs.profilesPath)) {
        const profiles = await this.readProfilesFromFS()
        profileExists = profiles[this.argv.profile] !== undefined
      }
      if (profileExists) {
        const overwrite = await this.prompt.confirm(
          interpolate(t.messages.profileOverwrite, { profile: this.argv.profile })
        )
        if (!overwrite) throw new errors.AbortedOperationError()
      } else {
        this.logger.log(interpolate(t.messages.profileCreate, { profile: this.argv.profile }), { prefix: 'ℹ︎' })
      }
      profileName = this.argv.profile
    }

    const promptedToken = await this.globalCache.sync('token', this.argv.token, async (previousToken) => {
      const prompted = await this.prompt.text(t.messages.enterToken, {
        initial: previousToken,
      })

      if (!prompted) {
        throw new errors.ParamRequiredError('Personal Access Token')
      }

      return prompted
    })
    if (this.argv.apiUrl !== consts.defaultBotpressApiUrl) {
      this.logger.log(interpolate(t.messages.customApiUrl, { url: this.argv.apiUrl }), { prefix: '🔗' })
    }
    const promptedWorkspaceId = await this.globalCache.sync('workspaceId', this.argv.workspaceId, async (defaultId) => {
      const tmpClient = new client.Client({ apiUrl: this.argv.apiUrl, token: promptedToken }) // no workspaceId yet
      const userWorkspaces = await paging
        .listAllPages(tmpClient.listWorkspaces, (r) => r.workspaces)
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.messages.couldNotListWorkspaces)
        })

      if (userWorkspaces.length === 0) {
        throw new errors.NoWorkspacesFoundError()
      }

      const initial = userWorkspaces.find((ws) => ws.id === defaultId)

      const prompted = await this.prompt.select(t.messages.selectWorkspace, {
        initial: initial && { title: initial.name, value: initial.id },
        choices: userWorkspaces.map((ws) => ({ title: ws.name, value: ws.id })),
      })

      if (!prompted) {
        throw new errors.ParamRequiredError('Workspace Id')
      }

      return prompted
    })

    await this.globalCache.set('apiUrl', this.argv.apiUrl)

    const api = this.api.newClient(
      { apiUrl: this.argv.apiUrl, token: promptedToken, workspaceId: promptedWorkspaceId },
      this.logger
    )

    await api.testLogin().catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, t.messages.loginFailed)
    })

    await this.writeProfileToFS(profileName, {
      apiUrl: this.argv.apiUrl,
      token: promptedToken,
      workspaceId: promptedWorkspaceId,
    })

    this.logger.success(t.messages.loggedIn)
  }
}
