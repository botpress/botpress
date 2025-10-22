import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import { Model } from 'src/schemas.gen'

const builtInModels = ['auto', 'best', 'fast']
const filteredLifecycles = ['deprecated', 'discontinued']

const modelsListPath = path.resolve(__dirname, 'src/cognitive-v2', 'models.ts')
const typesPath = path.resolve(__dirname, 'src/cognitive-v2', 'types.ts')

type RemoteModel = Model & { lifecycle?: string; aliases?: string[] }

const toRef = (m: RemoteModel | string | null | undefined): string | null => {
  if (!m) return null
  if (typeof m === 'string') return m

  if (m.id) return m.id
  return null
}

async function main(): Promise<void> {
  const server = process.env.COGNITIVE_SERVER || 'https://api.botpress.cloud/v2/cognitive'
  const key = process.env.TOKEN
  const botId = process.env.BOT_ID

  console.log('Fetching models ...')

  const {
    data: { models },
  } = await axios.get<{ models: RemoteModel[] }>(`${server}/models?includeDeprecated=true`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'X-Bot-Id': botId,
    },
  })

  const modelsObj = models.reduce((acc, m) => ((acc[m.id] = m), acc), {} as Record<string, RemoteModel>)

  const defaultModel: RemoteModel = {
    id: '',
    name: '',
    description: '',
    input: { costPer1MTokens: 0, maxTokens: 1_000_000 },
    output: { costPer1MTokens: 0, maxTokens: 1_000_000 },
    tags: [],
    lifecycle: 'live',
  }

  const newFile = `import { Model } from 'src/schemas.gen'\n
export type RemoteModel = Model & { aliases?: string[]; lifecycle: 'live' | 'beta' | 'deprecated' | 'discontinued' }\n
export const models: Record<string, RemoteModel>  = ${JSON.stringify(modelsObj, null, 2)}\n
export const defaultModel: RemoteModel = ${JSON.stringify(defaultModel, undefined, 2)}
`

  fs.writeFileSync(modelsListPath, newFile, 'utf8')

  console.log(`Saved ${models?.length} models to ${modelsListPath}`)

  const withoutDeprecated = models.filter((m) => !filteredLifecycles.includes(m.lifecycle))
  const refs = Array.from(new Set(withoutDeprecated.map(toRef).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const aliases = models.flatMap((m) =>
    (m.aliases || []).map((a) => {
      const [provider] = m.id.split(':')
      return `${provider}:${a}`
    })
  )

  const content = fs.readFileSync(typesPath, 'utf8')

  const startMarker = 'type Models ='
  const endMarker = 'export type CognitiveRequest'

  const startIdx = content.indexOf(startMarker)
  const endIdx = content.indexOf(endMarker)

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error('Could not locate Models union block in models.ts')
  }

  const items = [...builtInModels, ...refs, ...aliases].map((r) => `  | '${r}'`)
  const unionBlock = ['type Models =', ...items, '  | ({} & string)', ''].join('\n')

  const nextContent = content.slice(0, startIdx) + unionBlock + content.slice(endIdx)
  fs.writeFileSync(typesPath, nextContent, 'utf8')

  console.log(`Updated Models union in ${typesPath} with ${items.length} entries`)
}

main().catch((err: unknown) => {
  console.error(err && (err as Error).stack ? (err as Error).stack : err)
  process.exit(1)
})
