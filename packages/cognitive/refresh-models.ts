import 'dotenv/config'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import { Model } from 'src/cognitive-v2/types'

const builtInModels = ['auto', 'best', 'fast']
const filteredLifecycles = ['deprecated', 'discontinued']

const modelsListPath = path.resolve(__dirname, 'src/cognitive-v2', 'models.ts')
const typesPath = path.resolve(__dirname, 'src/cognitive-v2', 'types.ts')

const toRef = (m: Model | string | null | undefined): string | null => {
  if (!m) return null
  if (typeof m === 'string') return m

  if (m.id) return m.id
  return null
}

async function main(): Promise<void> {
  const server = process.env.CLOUD_COGNITIVE_ENDPOINT || 'https://api.botpress.cloud/v2/cognitive'
  const key = process.env.CLOUD_PAT
  const botId = process.env.CLOUD_BOT_ID

  const {
    data: { models },
  } = await axios.get<{ models: Model[] }>(`${server}/models?includeDeprecated=true`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'X-Bot-Id': botId,
    },
  })

  const modelsObj = models.reduce((acc, m) => ((acc[m.id] = m), acc), {} as Record<string, Model>)

  const defaultModel: Model = {
    id: '',
    name: '',
    description: '',
    input: { costPer1MTokens: 0, maxTokens: 1_000_000 },
    output: { costPer1MTokens: 0, maxTokens: 1_000_000 },
    tags: [],
    lifecycle: 'production',
  }

  const newFile = `import { Model } from './types'\n
export const models: Record<string, Model>  = ${JSON.stringify(modelsObj, null, 2)}\n
export const defaultModel: Model = ${JSON.stringify(defaultModel, undefined, 2)}
`

  fs.writeFileSync(modelsListPath, newFile, 'utf8')

  const collectRefs = (list: Model[]) =>
    Array.from(new Set(list.map(toRef).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const collectAliases = (list: Model[]) =>
    Array.from(new Set(list.flatMap((m) => (m.aliases || []).map((a) => `${m.id.split(':')[0]}:${a}`))))

  const active = models.filter((m) => !filteredLifecycles.includes(m.lifecycle))
  const activeLlm = active.filter((m) => !m.capabilities?.supportsTranscription)
  const activeStt = active.filter((m) => m.capabilities?.supportsTranscription)

  const refs = collectRefs(activeLlm)
  const aliases = collectAliases(models.filter((m) => !m.capabilities?.supportsTranscription))

  const sttRefs = collectRefs(activeStt)
  const sttAliases = collectAliases(activeStt)

  const content = fs.readFileSync(typesPath, 'utf8')

  // Update Models union
  const modelsStartMarker = 'export type Models ='
  const modelsEndMarker = 'export type SttModels ='

  const modelsStartIdx = content.indexOf(modelsStartMarker)
  const modelsEndIdx = content.indexOf(modelsEndMarker)

  if (modelsStartIdx === -1 || modelsEndIdx === -1 || modelsEndIdx <= modelsStartIdx) {
    throw new Error('Could not locate Models union block in types.ts')
  }

  const items = [...builtInModels, ...refs, ...aliases].map((r) => `  | '${r}'`)
  const modelsUnionBlock = ['export type Models =', ...items, '  | ({} & string)', '', ''].join('\n')

  let nextContent = content.slice(0, modelsStartIdx) + modelsUnionBlock + content.slice(modelsEndIdx)

  // Update SttModels union
  const sttStartMarker = 'export type SttModels ='
  const sttEndMarker = 'export type CognitiveContentPart'

  const sttStartIdx = nextContent.indexOf(sttStartMarker)
  const sttEndIdx = nextContent.indexOf(sttEndMarker)

  if (sttStartIdx === -1 || sttEndIdx === -1 || sttEndIdx <= sttStartIdx) {
    throw new Error('Could not locate SttModels union block in types.ts')
  }

  const sttItems = [...builtInModels, ...sttRefs, ...sttAliases].map((r) => `  | '${r}'`)
  const sttUnionBlock = ['export type SttModels =', ...sttItems, '  | ({} & string)', '', ''].join('\n')

  nextContent = nextContent.slice(0, sttStartIdx) + sttUnionBlock + nextContent.slice(sttEndIdx)

  fs.writeFileSync(typesPath, nextContent, 'utf8')
}

main().catch((err: unknown) => {
  console.error(err && (err as Error).stack ? (err as Error).stack : err)
  process.exit(1)
})
