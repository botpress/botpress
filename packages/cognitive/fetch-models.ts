import axios, { AxiosResponse } from 'axios'
import * as fs from 'fs'
import * as path from 'path'

interface Model {
  id?: string
  tags?: string[]
  input: {
    maxTokens: number
    costPer1MTokens: number
  }
  output: {
    maxTokens: number
    costPer1MTokens: number
  }
}

interface ModelsResponse {
  models: Model[]
}

const builtInModels = ['auto', 'best', 'fast', 'reasoning', 'cheapest', 'balance']

async function main(): Promise<void> {
  const server = 'https://api.botpress.cloud/v2/cognitive'
  const key = process.env.TOKEN
  const botId = process.env.BOT_ID

  console.log('Fetching models ...')
  const response: AxiosResponse<ModelsResponse> = await axios.get(`${server}/models`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'X-Bot-Id': botId,
    },
    timeout: 60000,
  })

  const models: Model[] = response.data.models
  const uniqueTags = [...new Set(models.map((m) => m.tags).flat())]
  console.log(`Unique tags: ${uniqueTags.join(', ')}`)

  const jsonOutPath = path.resolve(__dirname, 'src/cognitive-v2', 'live-models.ts')

  const modelsObj = models.reduce(
    (acc, m) => {
      acc[m.id] = { input: m.input, output: m.output, tags: m.tags }
      return acc
    },
    {} as Record<string, Model>
  )

  const modelsVar = `export const liveModels = ${JSON.stringify(modelsObj, null, 2)}`
  const knownVar = `export const knownTags = [${[...builtInModels, ...uniqueTags].map((t) => `'${t}'`).join(', ')}]`
  fs.writeFileSync(jsonOutPath, modelsVar + '\n' + knownVar, 'utf8')

  console.log(`Saved ${Array.isArray(models) ? models.length : 0} models to ${jsonOutPath}`)

  const toRef = (m: Model | string | null | undefined): string | null => {
    if (!m) return null
    if (typeof m === 'string') return m

    if (m.id) return m.id
    return null
  }

  const refs = Array.from(new Set(models.map(toRef).filter(Boolean))).sort((a, b) => a.localeCompare(b))

  const modelsTsPath = path.resolve(__dirname, 'src', 'cognitive-v2', 'models.ts')
  const content = fs.readFileSync(modelsTsPath, 'utf8')

  const startMarker = 'type Models ='
  const endMarker = 'export type CognitiveRequest'

  const startIdx = content.indexOf(startMarker)
  const endIdx = content.indexOf(endMarker)

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error('Could not locate Models union block in models.ts')
  }

  const autoLines = builtInModels.map((m) => `  | '${m}'`)
  const tagLines = (uniqueTags || []).map((t) => `  | '${t?.replace(/'/g, "\\'")}'`)
  const refLines = refs.map((r) => `  | '${r.replace(/'/g, "\\'")}'`)

  const unionBlock = ['type Models =', ...autoLines, ...tagLines, ...refLines, '  | ({} & string)', ''].join('\n')

  const nextContent = content.slice(0, startIdx) + unionBlock + content.slice(endIdx)
  fs.writeFileSync(modelsTsPath, nextContent, 'utf8')

  console.log(`Updated Models union in ${modelsTsPath} with ${refs.length} entries`)
}

main().catch((err: unknown) => {
  console.error(err && (err as Error).stack ? (err as Error).stack : err)
  process.exit(1)
})
