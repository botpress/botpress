import { Request, RuntimeError, z } from '@botpress/sdk'
import { LinearClient } from '@linear/sdk'
import axios from 'axios'
import queryString from 'query-string'
import * as bp from '.botpress'

type Credentials = bp.states.States['credentials']['payload']

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
  refresh_token: z.string().optional(),
  expires_in: z.number(),
})

type OAuthResponse = z.infer<typeof oauthSchema>

const tokenResquestSchema = z.object({
  actor: z.literal('application'),
  redirect_uri: z.string(),
})

const getAccessTokenRequestSchema = tokenResquestSchema.extend({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
})

const refreshTokenRequestSchema = tokenResquestSchema.extend({
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

  public constructor() {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
    this._redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`
  }

  private async _handleOAuthRequest<TSchema extends z.ZodObject>(
    url: string,
    body: z.infer<TSchema>
  ): Promise<OAuthResponse> {
    const { data } = await axios.post(
      url,
      { client_id: this._clientId, client_secret: this._clientSecret, ...body },
      { headers: oauthHeaders }
    )
    return data
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

  public async migrateOldToken(oldAccessToken: string): Promise<Credentials> {
    const data = await this._handleOAuthRequest<typeof migrateTokenRequestSchema>(
      `${linearEndpoint}/oauth/migrate_old_token`,
      {
        access_token: oldAccessToken,
      }
    )
    return this._parseCredentials(data)
  }

  public async refreshAccessToken(oldRefreshToken: string): Promise<Credentials> {
    const data = await this._handleOAuthRequest<typeof refreshTokenRequestSchema>(`${linearEndpoint}/oauth/token`, {
      grant_type: 'refresh_token',
      refresh_token: oldRefreshToken,
      actor: 'application',
      redirect_uri: this._redirectUri,
    })
    return this._parseCredentials(data)
  }

  public async getAccessTokenFromOAuthCode(code: string) {
    const data = await this._handleOAuthRequest<typeof getAccessTokenRequestSchema>(`${linearEndpoint}/oauth/token`, {
      grant_type: 'authorization_code',
      code,
      actor: 'application',
      redirect_uri: this._redirectUri,
    })
    return this._parseCredentials(data)
  }

  public async resolveValidCredentials(current: Credentials): Promise<Credentials> {
    if (!current.refreshToken) {
      return this.migrateOldToken(current.accessToken)
    }

    const FIVE_MINUTES_MS = 5 * 60 * 1000
    const isExpired = new Date(current.expiresAt).getTime() <= Date.now() + FIVE_MINUTES_MS

    if (isExpired) {
      return this.refreshAccessToken(current.refreshToken)
    }

    return current
  }

  public static async create(props: { client: bp.Client; ctx: bp.Context }) {
    const { ctx, client } = props
    if (ctx.configurationType === 'apiKey') {
      return new LinearClient({ apiKey: ctx.configuration.apiKey })
    }

    const {
      state: { payload },
    } = await client.getState({
      type: 'integration',
      name: 'credentials',
      id: ctx.integrationId,
    })

    const linearOauthClient = new LinearOauthClient()
    const credentials = await linearOauthClient.resolveValidCredentials(payload)

    if (credentials.accessToken !== payload.accessToken) {
      await client.setState({ type: 'integration', name: 'credentials', id: ctx.integrationId, payload: credentials })
    }

    return new LinearClient({ accessToken: credentials.accessToken })
  }
}

export const handleOauth = async (req: Request, client: bp.Client, ctx: bp.Context) => {
  const linearOauthClient = new LinearOauthClient()

  const query = queryString.parse(req.query)
  const code = query.code

  if (typeof code !== 'string') {
    throw new RuntimeError('Handler received an empty code')
  }

  const oAuthResponse = await linearOauthClient.getAccessTokenFromOAuthCode(code)
  const credentials = await linearOauthClient.resolveValidCredentials(oAuthResponse)

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: credentials,
  })

  const linearClient = new LinearClient({ accessToken: credentials.accessToken })
  const organization = await linearClient.organization
  await client.configureIntegration({ identifier: organization.id, scheduleRegisterCall: 'monthly' })
}
