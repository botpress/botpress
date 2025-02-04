import { Client } from '@botpress/client'
import { setupClient } from '@botpress/vai'
import { beforeAll } from 'vitest'

globalThis.STUDIO = false

beforeAll(async () => {
  if (!process.env.CLOUD_PAT) {
    throw new Error('Missing CLOUD_PAT')
  }

  if (!process.env.CLOUD_BOT_ID) {
    throw new Error('Missing CLOUD_BOT_ID')
  }

  setupClient(
    new Client({
      apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
      botId: process.env.CLOUD_BOT_ID,
      token: process.env.CLOUD_PAT,
    })
  )
})
