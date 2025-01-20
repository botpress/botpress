import { z, Request } from '@botpress/sdk'
import { LinearClient } from '@linear/sdk'
import axios from 'axios'
import queryString from 'query-string'
import * as bp from '.botpress'

type BaseEvent = {
  action: 'create' | 'update' | 'remove'
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
    description: string
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
    project: {
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

export async function getAccessToken(code: string) {
  await axios.post(
    `${linearEndpoint}/oauth/token`,
    {
      code,
      grant_type: 'authorization_code',
    },
    {
      headers: oauthHeaders,
    }
  )
}

const oauthSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
})

export class LinearOauthClient {
  private _clientId: string
  private _clientSecret: string

  public constructor() {
    this._clientId = bp.secrets.CLIENT_ID
    this._clientSecret = bp.secrets.CLIENT_SECRET
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

    const { access_token, expires_in } = oauthSchema.parse(res.data)

    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)

    return {
      accessToken: access_token,
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

    return new LinearClient({ accessToken: payload.accessToken })
  }
}

export const handleOauth = async (req: Request, client: bp.Client, ctx: bp.Context) => {
  const linearOauthClient = new LinearOauthClient()

  const query = queryString.parse(req.query)
  const code = query.code

  if (typeof code !== 'string') {
    throw new Error('Handler received an empty code')
  }

  const { accessToken, expiresAt } = await linearOauthClient.getAccessToken(code)

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: {
      accessToken,
      expiresAt,
    },
  })

  const linearClient = new LinearClient({ accessToken })
  const organization = await linearClient.organization
  await client.configureIntegration({ identifier: organization.id })
}
