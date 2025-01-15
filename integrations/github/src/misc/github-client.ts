import * as sdk from '@botpress/client'
import { App as OctokitApp, Octokit } from 'octokit'
import { GithubSettings } from './github-settings'
import { GRAPHQL_QUERIES, QUERY_INPUT, QUERY_RESPONSE } from './graphql-queries'
import * as types from './types'

type AuthenticatedEntity = Readonly<{
  id: string
  nodeId: string
  name: string
  handle: string
  avatarUrl: string
  type: 'App' | 'PAT'
  organizationHandle: string
  url: string
}>

export class GitHubClient {
  private _authenticatedEntity: AuthenticatedEntity | null = null

  private constructor(
    private readonly _octokit: Octokit,
    private readonly _isApp: boolean
  ) {}

  public static async create({ ctx, client }: { ctx: types.Context; client: types.Client }) {
    const octokit = await _getOctokit({ ctx, client })
    const isApp = ctx.configurationType !== 'manualPAT'

    return new GitHubClient(octokit, isApp)
  }

  public get rest() {
    return this._octokit.rest
  }

  public async executeGraphqlQuery<K extends keyof GRAPHQL_QUERIES>(
    queryName: K,
    variables: GRAPHQL_QUERIES[K][QUERY_INPUT]
  ): Promise<GRAPHQL_QUERIES[K][QUERY_RESPONSE]> {
    return await this._octokit.graphql(GRAPHQL_QUERIES[queryName].query, variables)
  }

  public async getAuthenticatedEntity() {
    if (!this._authenticatedEntity) {
      this._authenticatedEntity = await this._getGithubAuthenticatedEntity()
    }

    return this._authenticatedEntity
  }

  private async _getGithubAuthenticatedEntity() {
    return this._isApp ? await this._getGithubAuthenticatedApp() : await this._getGithubAuthenticatedUser()
  }

  private async _getGithubAuthenticatedApp() {
    const app = await this._octokit.rest.apps.getAuthenticated()
    const repos = await this._octokit.rest.apps.listReposAccessibleToInstallation({ per_page: 1 })
    const firstRepo = repos.data.repositories[0]

    if (!firstRepo) {
      throw new sdk.RuntimeError('No repositories found for the authenticated app')
    }

    return {
      id: app.data.id.toString(),
      nodeId: app.data.node_id,
      name: app.data.name,
      handle: app.data.slug as string,
      url: app.data.html_url,
      avatarUrl: `https://avatars.githubusercontent.com/in/${app.data.id}`,
      type: 'App',
      organizationHandle: firstRepo.owner.login,
    } as const satisfies AuthenticatedEntity
  }

  private async _getGithubAuthenticatedUser() {
    const user = await this._octokit.rest.users.getAuthenticated()
    const repos = await this._octokit.rest.repos.listForAuthenticatedUser({ per_page: 1 })
    const firstRepo = repos.data[0]

    if (!firstRepo) {
      throw new sdk.RuntimeError('No repositories found for the authenticated user')
    }

    return {
      id: user.data.id.toString(),
      nodeId: user.data.node_id,
      name: user.data.name ?? user.data.login,
      handle: user.data.login,
      url: user.data.html_url,
      avatarUrl: user.data.avatar_url,
      type: 'PAT',
      organizationHandle: firstRepo.owner.login,
    } as const satisfies AuthenticatedEntity
  }
}

const _getOctokit = async ({ ctx, client }: { ctx: types.Context; client: types.Client }) => {
  if (ctx.configurationType === 'manualPAT') {
    return _getOctokitForPAT({ ctx })
  }

  return await _getOctokitForApp({ ctx, client })
}

const _getOctokitForApp = async ({ ctx, client }: { ctx: types.Context; client: types.Client }) => {
  const { appId, privateKey, installationId } = GithubSettings.getAppSettings({ ctx, client })

  try {
    const octokitApp = new OctokitApp({ appId, privateKey })
    return await octokitApp.getInstallationOctokit(await installationId)
  } catch {
    throw new sdk.RuntimeError('Failed to authenticate with GitHub. Please check your credentials and try again.')
  }
}

const _getOctokitForPAT = ({ ctx }: { ctx: types.Context }) => {
  if (ctx.configurationType !== 'manualPAT') {
    throw new sdk.RuntimeError('Invalid configuration type')
  }

  return new Octokit({ auth: ctx.configuration.personalAccessToken })
}
