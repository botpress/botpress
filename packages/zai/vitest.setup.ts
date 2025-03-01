import { setupClient } from '@botpress/vai'
import { beforeAll } from 'vitest'
import { getClient } from './e2e/utils'

globalThis.STUDIO = false

beforeAll(async () => {
  if (!process.env.CLOUD_PAT) {
    throw new Error('Missing CLOUD_PAT')
  }

  if (!process.env.CLOUD_BOT_ID) {
    throw new Error('Missing CLOUD_BOT_ID')
  }

  setupClient(getClient())
})
