import { z, Request, RuntimeError } from '@botpress/sdk'
import { LinearClient } from '@linear/sdk'
import axios from 'axios'
import queryString from 'query-string'
import * as bp from '.botpress'

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

const migrationSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
})

export class LinearOauthClient {
  private _clientId: string
  private _clientSecret: string

  public constructor() {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
  }

  public async migrateOldToken(oldAccessToken: string) {
    const expiresAt = new Date()

    const res = await axios.post(
      `${linearEndpoint}/oauth/migrate_old_token`,
      {
        access_token: oldAccessToken,
        client_id: this._clientId,
        client_secret: this._clientSecret,
      },
      {
        headers: oauthHeaders,
      }
    )

    const { access_token, expires_in, refresh_token } = migrationSchema.parse(res.data)

    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expiresAt.toISOString(),
    }
  }

  public async refreshAccessToken(oldRefreshToken: string) {
    const expiresAt = new Date()

    const res = await axios.post(
      `${linearEndpoint}/oauth/token`,
      {
        client_id: this._clientId,
        client_secret: this._clientSecret,
        actor: 'application',
        redirect_uri: `${process.env.BP_WEBHOOK_URL}/oauth`,
        refresh_token: oldRefreshToken,
        grant_type: 'refresh_token',
      },
      {
        headers: oauthHeaders,
      }
    )

    const { access_token, expires_in, refresh_token } = oauthSchema.parse(res.data)

    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expiresAt.toISOString(),
    }
  }

  public async getAccessToken(code: string) {
    const expiresAt = new Date()

    const res = await axios.post(
      `${linearEndpoint}/oauth/token`,
      {
        client_id: this._clientId,
        client_secret: this._clientSecret,
        actor: 'application',
        redirect_uri: `${process.env.BP_WEBHOOK_URL}/oauth`,
        code,
        grant_type: 'authorization_code',
      },
      {
        headers: oauthHeaders,
      }
    )

    const { access_token, expires_in, refresh_token } = oauthSchema.parse(res.data)

    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
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

  let credentials = await linearOauthClient.getAccessToken(code)

  if (!credentials.refreshToken) {
    credentials = await linearOauthClient.migrateOldToken(credentials.accessToken)
  }

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
