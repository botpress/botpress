import { Client } from '@botpress/client'
import { beforeAll } from 'vitest'
import { init } from './src/utils.js'

beforeAll(async () => {
  await init()

  if (!process.env.CLOUD_PAT) {
    throw new Error('Missing CLOUD_PAT')
  }

  if (!process.env.CLOUD_BOT_ID) {
    throw new Error('Missing CLOUD_BOT_ID')
  }

  const client = new Client({
    apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT,
  })

  const { integration: openai } = await client.getPublicIntegration({
    name: 'openai',
    version: 'latest',
  })

  await client.updateBot({
    id: process.env.CLOUD_BOT_ID,
    integrations: {
      [openai.id]: {
        enabled: true,
      },
    },
  })
})
