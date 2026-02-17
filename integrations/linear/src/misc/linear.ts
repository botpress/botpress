import { Request, RuntimeError, z } from '@botpress/sdk'
import { LinearClient } from '@linear/sdk'
import axios from 'axios'
import queryString from 'query-string'
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

const refreshOAuthSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
})

type TokenRequestParams = {
  actor: 'application'
  redirect_uri: string
}
type GetAccessTokenParams = {
  grant_type: 'authorization_code'
  code: string
}

type RefreshTokenRequestParams = {
  grant_type: 'refresh_token'
  refresh_token: string
}

type MigrateTokenRequestParams = {
  access_token: string
}

type OAuthRequestParams =
  | (TokenRequestParams & GetAccessTokenParams)
  | (TokenRequestParams & RefreshTokenRequestParams)
  | MigrateTokenRequestParams

export class LinearOauthClient {
  private _clientId: string
  private _clientSecret: string
  private _redirectUri: string

  public constructor() {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
    this._redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`
  }

  private async _postOAuth<T extends z.ZodSchema>(
    url: string,
    body: OAuthRequestParams,
    schema: T
  ): Promise<z.infer<T>> {
    const res = await axios.post(
      url,
      { client_id: this._clientId, client_secret: this._clientSecret, ...body },
      { headers: oauthHeaders }
    )

    const { data, error } = schema.safeParse(res.data)
    if (error) {
      throw new Error(`Failed to parse OAuth token response: ${error.message}`)
    }

    return data
  }

  private async _getAccessToken<T extends z.ZodSchema>(
    params: GetAccessTokenParams | RefreshTokenRequestParams,
    schema: T
  ): Promise<z.infer<T>> {
    return this._postOAuth(
      `${linearEndpoint}/oauth/token`,
      {
        redirect_uri: this._redirectUri,
        actor: 'application',
        ...params,
      },
      schema
    )
  }

  private _toCredentials(data: z.infer<typeof refreshOAuthSchema>): Credentials {
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: expiresAt.toISOString(),
    }
  }

  public async migrateOldToken(oldAccessToken: string): Promise<Credentials> {
    const data = await this._postOAuth(
      `${linearEndpoint}/oauth/migrate_old_token`,
      {
        access_token: oldAccessToken,
      },
      refreshOAuthSchema
    )
    return this._toCredentials(data)
  }

  public async refreshAccessToken(oldRefreshToken: string): Promise<Credentials> {
    const data = await this._getAccessToken(
      { grant_type: 'refresh_token', refresh_token: oldRefreshToken },
      refreshOAuthSchema
    )
    return this._toCredentials(data)
  }

  public async getAccessToken(code: string) {
    const data = await this._getAccessToken({ grant_type: 'authorization_code', code }, oauthSchema)

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: expiresAt.toISOString(),
    }
  }

  public async getLinearClient(client: bp.Client, ctx: bp.Context, integrationId: string) {
    if (ctx.configurationType === 'apiKey') {
      return new LinearClient({ apiKey: ctx.configuration.apiKey })
    }

    const {
      state: { payload },
    } = await client.getState({
      type: 'integration',
      name: 'credentials',
      id: integrationId,
    })

    if (!payload.refreshToken) {
      const newCredentials = await this.migrateOldToken(payload.accessToken)

      await client.setState({
        type: 'integration',
        name: 'credentials',
        id: integrationId,
        payload: newCredentials,
      })

      return new LinearClient({ accessToken: newCredentials.accessToken })
    }

    const FIVE_MINUTES_MS = 5 * 60 * 1000
    const isExpired = new Date(payload.expiresAt).getTime() <= Date.now() + FIVE_MINUTES_MS

    if (isExpired) {
      const newCredentials = await this.refreshAccessToken(payload.refreshToken)

      await client.setState({
        type: 'integration',
        name: 'credentials',
        id: integrationId,
        payload: newCredentials,
      })

      return new LinearClient({ accessToken: newCredentials.accessToken })
    }

    return new LinearClient({ accessToken: payload.accessToken })
  }
}

export const handleOauth = async (req: Request, client: bp.Client, ctx: bp.Context) => {
  const linearOauthClient = new LinearOauthClient()

  const query = queryString.parse(req.query)
  const code = query.code

  if (typeof code !== 'string') {
    throw new RuntimeError('Handler received an empty code')
  }

  const tokenResponse = await linearOauthClient.getAccessToken(code)

  const credentials = tokenResponse.refreshToken
    ? tokenResponse
    : await linearOauthClient.migrateOldToken(tokenResponse.accessToken)

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: credentials,
  })

  const linearClient = new LinearClient({ accessToken: credentials.accessToken })
  const organization = await linearClient.organization
  await client.configureIntegration({ identifier: organization.id })
}
