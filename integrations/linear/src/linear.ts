import type { Client } from '@botpress/client'
import { LinearClient } from '@linear/sdk'
import axios from 'axios'
import { z } from 'zod'
import { secrets } from '.botpress'

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
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = secrets.CLIENT_ID
    this.clientSecret = secrets.CLIENT_SECRET
  }

  async getAccessToken(code: string) {
    const expiresAt = new Date()

    const res = await axios.post(
      `${linearEndpoint}/oauth/token`,
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
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

  async getLinearClient(client: Client, integrationId: string) {
    const {
      state: { payload },
    } = await client.getState({
      type: 'integration',
      name: 'credentials',
      id: integrationId,
    })

    return new LinearClient(payload.accessToken)
  }
}
