import { z, transforms, JSONSchema } from '@botpress/sdk'
import path from 'path'
import { createSyncFn } from 'synckit'

type ZuiToJsonSchema = typeof transforms.zuiToJsonSchema
type JsonSchema = ReturnType<ZuiToJsonSchema>
type ObjectJsonSchema = Extract<JsonSchema, { type: 'object' }>

type SchemaOptions = {
  title?: string
  examples?: any[]
}

type SchemaDefinition = {
  schema: z.ZodObject<any>
  ui?: Record<string, SchemaOptions | undefined>
}

export type ZodToJsonOptions = {
  dereference?: boolean
}

const isObjectSchema = (schema: JsonSchema): schema is ObjectJsonSchema => schema.type === 'object'

export function mapZodToJsonSchema(
  definition: SchemaDefinition,
  options: ZodToJsonOptions = {}
): ReturnType<typeof transforms.zuiToJsonSchema> {
  let schema = transforms.zuiToJsonSchema(definition.schema, { target: 'jsonSchema7' })

  if (options.dereference) {
    schema = _syncDereference(schema) as JSONSchema satisfies JSONSchema
  }

  if (!isObjectSchema(schema) || !definition.ui) {
    return schema
  }

  for (const [key, value] of Object.entries(definition.ui ?? {})) {
    const property = schema.properties?.[key]

    if (!property) {
      continue
    }

    if (!!value?.title) {
      ;(property as any).title = value.title
    }

    if (!!value?.examples) {
      ;(property as any).examples = value.examples
    }
  }

  return schema
}

const _syncDereference = createSyncFn<(schema: JSONSchema) => Promise<JSONSchema>>(
  path.resolve(__dirname, 'schema-utils-dereference.js'),
  {
    tsRunner: 'ts-node',
  }
)
