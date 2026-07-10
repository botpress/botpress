import { RuntimeError, z } from '@botpress/sdk'
import { LinearClient } from '@linear/sdk'
import axios from 'axios'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { useDeskOAuth } from './utils'
import * as bp from '.botpress'

type Credentials = bp.states.States['credentials']['payload']

type BaseEvent = {
  action: 'create' | 'update' | 'remove' | 'restore'
  type: string
  webhookTimestamp: number
  data: {
    issueId?: string
    userId?: string
    user?: {
      id: string
    }
  }
}

export type LinearIssueEvent = {
  type: 'issue'
  data: {
    id: string
    identifier: string
    url: string
    creatorId: string
    labelIds?: string[]
    number: number
    title: string
    updatedAt: string
    createdAt: string
    description: string | null
    priority: number
    labels: {
      name: string
    }[]
    subscriberIds: string[]
    assignee?: {
      id: string
    }
    team?: {
      id: string
      key: string
      name: string
    }
    state: {
      name: string
      color: string
      type: string
    }
    project?: {
      id: string
    }
  }
} & BaseEvent

export type LinearCommentEvent = {
  type: 'comment'
  data: {
    id: string
    body: string
    issue: {
      id: string
    }
  }
} & BaseEvent

export type LinearEvent = LinearCommentEvent | LinearIssueEvent

const linearEndpoint = 'https://api.linear.app'

const oauthHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded',
} as const

const oauthSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
})

type OAuthResponse = z.infer<typeof oauthSchema>

export type Actor = 'user' | 'app'

const tokenRequestSchema = z.object({
  actor: z.enum(['user', 'app']),
  redirect_uri: z.string(),
})

const getAccessTokenRequestSchema = tokenRequestSchema.extend({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
})

const refreshTokenRequestSchema = tokenRequestSchema.extend({
  grant_type: z.literal('refresh_token'),
  refresh_token: z.string(),
})

const migrateTokenRequestSchema = z.object({
  access_token: z.string(),
})

export class LinearOauthClient {
  private _clientId: string
  private _clientSecret: string
  private _redirectUri: string

  public constructor(useDeskOAuth?: boolean) {
    this._clientId = useDeskOAuth ? bp.secrets.DESK_CLIENT_ID : bp.secrets.CLIENT_ID
    this._clientSecret = useDeskOAuth ? bp.secrets.DESK_CLIENT_SECRET : bp.secrets.CLIENT_SECRET
    this._redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`
  }

  private async _handleOAuthRequest<TSchema extends z.ZodObject>(
    url: string,
    body: z.infer<TSchema>
  ): Promise<OAuthResponse> {
    const form = new URLSearchParams({
      client_id: this._clientId,
      client_secret: this._clientSecret,
      ...body,
    })
    try {
      const response = await axios.post(url, form.toString(), { headers: oauthHeaders })
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.error_description || err.message
        throw new RuntimeError(`OAuth request failed: ${message}`)
      }
      throw new RuntimeError(`OAuth request failed: ${String(err)}`)
    }
  }

  private _parseCredentials(res: OAuthResponse): Credentials {
    const { data, error } = oauthSchema.safeParse(res)
    if (error) {
      throw new RuntimeError(`Failed to parse OAuth token response: ${error.message}`)
    }
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: expiresAt.toISOString(),
    }
  }

  @handleErrors('Failed to migrate old Linear OAuth token')
  public async migrateOldToken(oldAccessToken: string): Promise<Credentials> {
    const data = await this._handleOAuthRequest<typeof migrateTokenRequestSchema>(
      `${linearEndpoint}/oauth/migrate_old_token`,
      {
        access_token: oldAccessToken,
      }
    )
    return this._parseCredentials(data)
  }

  @handleErrors('Failed to refresh Linear OAuth access token')
  public async getAccessTokenFromRefreshToken(oldRefreshToken: string, actor: Actor): Promise<Credentials> {
    const data = await this._handleOAuthRequest<typeof refreshTokenRequestSchema>(`${linearEndpoint}/oauth/token`, {
      grant_type: 'refresh_token',
      refresh_token: oldRefreshToken,
      actor,
      redirect_uri: this._redirectUri,
    })
    return this._parseCredentials(data)
  }

  @handleErrors('Failed to obtain Linear OAuth access token from authorization code')
  public async getAccessTokenFromOAuthCode(code: string, actor: Actor) {
    const data = await this._handleOAuthRequest<typeof getAccessTokenRequestSchema>(`${linearEndpoint}/oauth/token`, {
      grant_type: 'authorization_code',
      code,
      actor,
      redirect_uri: this._redirectUri,
    })
    if (!data.refresh_token) {
      return this.migrateOldToken(data.access_token)
    }
    return this._parseCredentials(data)
  }

  @handleErrors('Failed to resolve valid Linear OAuth credentials')
  public async resolveValidCredentials(current: Credentials, actor: Actor): Promise<Credentials> {
    const FIVE_MINUTES_MS = 5 * 60 * 1000
    const isExpired = new Date(current.expiresAt).getTime() <= Date.now() + FIVE_MINUTES_MS

    if (isExpired) {
      return this.getAccessTokenFromRefreshToken(current.refreshToken, actor)
    }

    return current
  }

  @handleErrors('Failed to create Linear client')
  public static async create(props: { client: bp.Client; ctx: bp.Context }) {
    return LinearOauthClient._createFromStoredCredentials(props, 'credentials')
  }

  public static async createAdmin(props: { client: bp.Client; ctx: bp.Context }) {
    return LinearOauthClient._createFromStoredCredentials(props, 'adminCredentials')
  }

  private static async _createFromStoredCredentials(
    props: { client: bp.Client; ctx: bp.Context },
    stateName: 'credentials' | 'adminCredentials'
  ) {
    const { ctx, client } = props
    if (ctx.configurationType === 'apiKey') {
      return new LinearClient({ apiKey: ctx.configuration.apiKey })
    }

    const {
      state: { payload },
    } = await client.getState({
      type: 'integration',
      name: stateName,
      id: ctx.integrationId,
    })

    let effectiveStateName = stateName
    let effectivePayload = payload
    if (stateName === 'adminCredentials' && !payload.accessToken) {
      const {
        state: { payload: fallbackPayload },
      } = await client.getState({
        type: 'integration',
        name: 'credentials',
        id: ctx.integrationId,
      })
      effectiveStateName = 'credentials'
      effectivePayload = fallbackPayload
    }

    const {
      state: { payload: environment },
    } = await client.getState({
      type: 'integration',
      name: 'environment',
      id: ctx.integrationId,
    })
    const useDesk = useDeskOAuth(environment)
    const linearOauthClient = new LinearOauthClient(useDesk)
    const actor: Actor = effectiveStateName === 'adminCredentials' ? 'user' : (environment.runtimeActor ?? 'app')
    const credentials = await linearOauthClient.resolveValidCredentials(effectivePayload, actor)

    if (credentials.accessToken !== effectivePayload.accessToken) {
      await client.setState({
        type: 'integration',
        name: effectiveStateName,
        id: ctx.integrationId,
        payload: credentials,
      })
    }

    return new LinearClient({ accessToken: credentials.accessToken })
  }
}

const _findWebhookByUrl = async (linearClient: LinearClient, url: string) => {
  let page = await linearClient.webhooks()
  while (true) {
    const match = page.nodes.find((w) => w.url === url)
    if (match) {
      return match
    }
    if (!page.pageInfo.hasNextPage) {
      return undefined
    }
    page = await page.fetchNext()
  }
}

export const unregisterWebhook = async ({
  linearClient,
  logger,
  url,
}: {
  linearClient: LinearClient
  logger: bp.Logger
  url: string
}) => {
  const webhook = await _findWebhookByUrl(linearClient, url)
  if (!webhook) {
    logger.forBot().info('No Linear webhook found to unregister, skipping...')
    return
  }

  logger.forBot().info('Unregistering Linear webhook...')
  await linearClient.deleteWebhook(webhook.id)
  logger.forBot().info('Linear webhook unregistered successfully.')
}

export const registerWebhook = async ({
  linearClient,
  logger,
  url,
}: {
  linearClient: LinearClient
  logger: bp.Logger
  url: string
}) => {
  const existing = await _findWebhookByUrl(linearClient, url)
  if (existing) {
    logger.forBot().info('Linear webhook already registered, skipping...')
    return
  }

  logger.forBot().info('Registering Linear webhook...')
  await linearClient.createWebhook({
    url,
    resourceTypes: ['Issue', 'Comment'],
    secret: bp.secrets.WEBHOOK_SIGNING_SECRET,
    allPublicTeams: true,
    label: 'Botpress',
  })
  logger.forBot().info('Linear webhook registered successfully.')
}

export const revokeToken = async (token: string, tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token') => {
  const form = new URLSearchParams({ token, token_type_hint: tokenTypeHint })
  try {
    await axios.post(`${linearEndpoint}/oauth/revoke`, form.toString(), { headers: oauthHeaders })
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.error_description || err.message
      throw new RuntimeError(`Failed to revoke token: ${message}`)
    }
    throw new RuntimeError(`Failed to revoke token: ${String(err)}`)
  }
}
