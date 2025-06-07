import 'dotenv/config'
import { setupClient } from '@botpress/vai'
import { beforeAll } from 'vitest'
import { getClient } from './e2e/utils'

globalThis.STUDIO = false

beforeAll(async () => {
  const token = process.env.CLOUD_PAT
  if (!token) {
    throw new Error('Missing CLOUD_PAT')
  }

  const botId = process.env.CLOUD_BOT_ID
  if (!botId) {
    throw new Error('Missing CLOUD_BOT_ID')
  }

  const client = getClient()

  const { integration: openai } = await client.getPublicIntegration({
    name: 'openai',
    version: 'latest',
  })

  await client.updateBot({
    id: botId,
    integrations: {
      [openai.id]: {
        enabled: true,
      },
    },
  })

  setupClient(client)
})
