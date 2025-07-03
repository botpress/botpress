import { Client } from '@botpress/client'
import { Cognitive } from '@botpress/cognitive'
import { type TextTokenizer, getWasmTokenizer } from '@bpinternal/thicktoken'
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll } from 'vitest'
import { Zai } from '../src'
import { getCachedCognitiveClient } from './client'

const DATA_PATH = path.join(__dirname, 'data')
const DOC_PATH = path.join(DATA_PATH, 'botpress_docs.txt')

export const getClient = () => {
  return new Client({
    apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT,
  })
}

export const getCachedClient = () => {
  return getCachedCognitiveClient()
}

export const getZai = (cognitive?: Cognitive) => {
  const client = cognitive || getCachedClient()
  return new Zai({ client })
}

export let tokenizer: TextTokenizer = null!

beforeAll(async () => {
  tokenizer = (await getWasmTokenizer()) as TextTokenizer
})

export const BotpressDocumentation = fs.readFileSync(DOC_PATH, 'utf-8').trim()

export const metadata = { cost: { input: 1, output: 1 }, latency: 0, model: '', tokens: { input: 1, output: 1 } }
