import type { Request } from '@botpress/sdk'
import axios from 'axios'
import { verifyKey } from 'discord-interactions'
import { z } from 'zod'
import { secrets } from '.botpress'

const discordEndpoint = 'https://discord.com/api/v10'

export const commandName = 'chat'

const commands = [
  {
    name: commandName,
    description: 'Chat with your Botpress bot',
    type: 1,
    options: [
      {
        type: 3,
        name: 'text',
        description: 'Text to will be sent to your bot',
        required: true,
      },
    ],
  },
] as const

const getExpiryDate = (expiryInSeconds: number) => {
  const expiryDate = new Date()
  expiryDate.setSeconds(expiryDate.getSeconds() + (expiryInSeconds - 300)) // Offset 5 minutes earlier to be sure
  return expiryDate
}

const oauthHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded',
} as const

const accessTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
})

async function discordRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any, headers?: any) {
  const res = await axios
    .request({
      url: `${discordEndpoint}${endpoint}`,
      method,
      data: body,
      headers,
    })
    .catch((err) => {
      console.error(err)
      throw err
    })

  return res.data
}

export class DiscordClient {
  private clientId: string
  private clientSecret: string
  private publicKey: string
  private applicationId: string
  private botToken: string

  constructor() {
    this.applicationId = secrets.APPLICATION_ID
    this.botToken = secrets.BOT_TOKEN
    this.clientId = secrets.CLIENT_ID
    this.publicKey = secrets.PUBLIC_KEY
    this.clientSecret = secrets.CLIENT_SECRET
  }

  async getAccessToken(code: string) {
    const discordData = await discordRequest(
      '/oauth2/token',
      'POST',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: 'https://webhook.botpress.cloud/oauth',
        code,
      },
      oauthHeaders
    )

    const data = accessTokenResponseSchema.parse(discordData)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
      expiryDate: getExpiryDate(data.expires_in),
    }
  }

  async refreshAccessToken(refreshToken: string) {
    const discordData = await discordRequest(
      '/oauth2/token',
      'POST',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      oauthHeaders
    )

    const data = accessTokenResponseSchema.parse(discordData)

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      scope: data.scope,
      expiryDate: getExpiryDate(data.expires_in),
    }
  }

  verifyRequest(req: Request) {
    const signature = req.headers['x-signature-ed25519'] ?? ''
    const timestamp = req.headers['x-signature-timestamp'] ?? ''
    const body = req.body ?? ''

    return verifyKey(body, signature, timestamp, this.publicKey)
  }

  async installGlobalCommands() {
    await discordRequest(`/applications/${this.applicationId}/commands`, 'PUT', commands, {
      Authorization: `Bot ${this.botToken}`,
    })
  }
}
