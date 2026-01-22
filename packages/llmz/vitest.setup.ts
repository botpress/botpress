import { beforeAll } from 'vitest'
import { init } from './src/utils.js'

beforeAll(async () => {
  await init()
})
