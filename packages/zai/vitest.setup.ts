import 'dotenv/config'
import { setupClient } from '@botpress/vai'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './e2e/mocks/server'
import { getClient } from './e2e/utils'

globalThis.STUDIO = false

// Setup MSW before all tests
beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'warn' })
})

// Reset MSW handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Clean up MSW after all tests
afterAll(() => {
  server.close()
})

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
