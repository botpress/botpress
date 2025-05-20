import { Client } from '@botpress/client'
import { beforeAll } from 'vitest'
import { setupClient } from './src/hooks/setupClient'

beforeAll(async () => {
  if (!process.env.CLOUD_PAT) {
    throw new Error('Missing CLOUD_PAT')
  }

  if (!process.env.CLOUD_BOT_ID) {
    throw new Error('Missing CLOUD_BOT_ID')
  }

  const apiUrl: string = process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev'
  const botId: string = process.env.CLOUD_BOT_ID
  const token: string = process.env.CLOUD_PAT

  const client = new Client({
    apiUrl,
    botId,
    token,
  })

  const { integration } = await client.getPublicIntegration({
    name: 'openai',
    version: 'latest',
  })

  await client.updateBot({
    id: botId,
    integrations: {
      [integration.id]: {
        enabled: true,
      },
    },
  })

  setupClient(client)
})
