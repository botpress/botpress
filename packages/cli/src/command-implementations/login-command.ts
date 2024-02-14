import * as client from '@botpress/client'
import * as paging from '../api/paging'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { GlobalCommand } from './global-command'

export type LoginCommandDefinition = typeof commandDefinitions.login
export class LoginCommand extends GlobalCommand<LoginCommandDefinition> {
  public async run(): Promise<void> {
    const promptedToken = await this.globalCache.sync('token', this.argv.token, async (previousToken) => {
      const prompted = await this.prompt.text('Enter your Personal Access Token', {
        initial: previousToken,
      })

      if (!prompted) {
        throw new errors.ParamRequiredError('Personal Access Token')
      }

      return prompted
    })

    const promptedWorkspaceId = await this.globalCache.sync('workspaceId', this.argv.workspaceId, async (defaultId) => {
      const tmpClient = new client.Client({ apiUrl: this.argv.apiUrl, token: promptedToken }) // no workspaceId yet
      const userWorkspaces = await paging
        .listAllPages(tmpClient.listWorkspaces, (r) => r.workspaces)
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, 'Could not list workspaces')
        })

      if (userWorkspaces.length === 0) {
        throw new errors.NoWorkspacesFoundError()
      }

      const initial = userWorkspaces.find((ws) => ws.id === defaultId)

      const prompted = await this.prompt.select('Which workspace do you want to login to?', {
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
      throw errors.BotpressCLIError.wrap(thrown, 'Login failed. Please check your credentials')
    })

    this.logger.success('Logged In')
  }
}
