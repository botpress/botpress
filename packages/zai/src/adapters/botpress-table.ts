import { type Client } from '@botpress/client'
import { z } from '@bpinternal/zui'

import { BotpressClient, GenerationMetadata } from '../utils'
import { Adapter, GetExamplesProps, SaveExampleProps } from './adapter'

const CRITICAL_TAGS = {
  system: 'true',
  'schema-purpose': 'active-learning',
  'schema-version': 'Oct-2024',
} as const

const OPTIONAL_TAGS = {
  'x-studio-title': 'Active Learning',
  'x-studio-description': 'Table for storing active learning tasks and examples',
  'x-studio-readonly': 'true',
  'x-studio-icon': 'lucide://atom',
  'x-studio-color': 'green',
} as const

const FACTOR = 30

const Props = z.object({
  client: BotpressClient,
  tableName: z
    .string()
    .regex(
      /^[a-zA-Z0-9_]{1,45}Table$/,
      'Table name must be lowercase and contain only letters, numbers and underscores'
    ),
})

export type TableSchema = z.input<typeof TableSchema>
const TableSchema = z.object({
  taskType: z.string().describe('The type of the task (filter, extract, etc.)'),
  taskId: z.string(),
  key: z.string().describe('A unique key for the task (e.g. a hash of the input, taskId, taskType and instructions)'),
  instructions: z.string(),
  input: z.object({}).passthrough().describe('The input to the task'),
  output: z.object({}).passthrough().describe('The expected output'),
  explanation: z.string().nullable(),
  metadata: GenerationMetadata,
  status: z.enum(['pending', 'rejected', 'approved']),
  feedback: z
    .object({
      rating: z.enum(['very-bad', 'bad', 'good', 'very-good']),
      comment: z.string().nullable(),
    })
    .nullable()
    .default(null),
})

const searchableColumns = ['input'] as const satisfies Array<keyof typeof TableSchema.shape> as string[]

const TableJsonSchema = Object.entries(TableSchema.shape).reduce((acc, [key, value]) => {
  acc[key] = value.toJsonSchema()
  acc[key]['x-zui'] ??= {}
  acc[key]['x-zui'].searchable = searchableColumns.includes(key)
  return acc
}, {})

export class TableAdapter extends Adapter {
  private _client: Client
  private _tableName: string

  private _status: 'initialized' | 'ready' | 'error'

  public constructor(props: z.input<typeof Props>) {
    super()
    props = Props.parse(props)
    this._client = props.client
    this._tableName = props.tableName
    this._status = 'ready'
  }

  public async getExamples<TInput, TOutput>({ taskType, taskId, input }: GetExamplesProps<TInput>) {
    await this._assertTableExists()

    const { rows } = await this._client
      .findTableRows({
        table: this._tableName,
        search: JSON.stringify({ value: input }).substring(0, 1023), // Search is limited to 1024 characters
        limit: 10, // TODO
        filter: {
          // Proximity match of approved examples
          taskType,
          taskId,
          status: 'approved',
        } satisfies Partial<TableSchema>,
      })
      .catch((err) => {
        // TODO: handle error
        console.error(`Error fetching examples: ${err.message}`)
        return { rows: [] }
      })

    return rows.map((row) => ({
      key: row.key,
      input: row.input.value as TInput,
      output: row.output.value as TOutput,
      explanation: row.explanation,
      similarity: row.similarity ?? 0,
    }))
  }

  public async saveExample<TInput, TOutput>({
    key,
    taskType,
    taskId,
    instructions,
    input,
    output,
    explanation,
    metadata,
    status = 'pending',
  }: SaveExampleProps<TInput, TOutput>) {
    await this._assertTableExists()

    await this._client
      .upsertTableRows({
        table: this._tableName,
        keyColumn: 'key',
        rows: [
          {
            key,
            taskType,
            taskId,
            instructions,
            input: { value: input },
            output: { value: output },
            explanation: explanation ?? null,
            status,
            metadata,
          } satisfies TableSchema,
        ],
      })
      .catch(() => {
        // TODO: handle error
      })
  }

  private async _assertTableExists() {
    if (this._status !== 'ready') {
      return
    }

    const { table, created } = await this._client
      .getOrCreateTable({
        table: this._tableName,
        factor: FACTOR,
        frozen: true,
        isComputeEnabled: false,
        tags: {
          ...CRITICAL_TAGS,
          ...OPTIONAL_TAGS,
        },
        schema: TableJsonSchema,
      })
      .catch(() => {
        this._status = 'error'
        return { table: null, created: false }
      })

    if (!table) {
      return
    }

    if (!created) {
      const issues: string[] = []

      if (table.factor !== FACTOR) {
        issues.push(`Factor is ${table.factor} instead of ${FACTOR}`)
      }

      if (table.frozen !== true) {
        issues.push('Table is not frozen')
      }

      for (const [key, value] of Object.entries(CRITICAL_TAGS)) {
        if (table.tags?.[key] !== value) {
          issues.push(`Tag ${key} is ${table.tags?.[key]} instead of ${value}`)
        }
      }

      for (const key of Object.keys(TableJsonSchema)) {
        const column = table.schema?.properties[key]
        const expected = TableJsonSchema[key] as { type: string }

        if (!column) {
          issues.push(`Column ${key} is missing`)
          continue
        }

        if (column.type !== expected.type) {
          issues.push(`Column ${key} has type ${column.type} instead of ${expected.type}`)
        }

        if (expected['x-zui'].searchable && !column['x-zui'].searchable) {
          issues.push(`Column ${key} is not searchable but should be`)
        }
      }

      if (issues.length) {
        this._status = 'error'
      }
    }

    this._status = 'initialized'
  }
}
