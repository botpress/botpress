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
})
