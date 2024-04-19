import { z, transforms } from '@botpress/sdk'

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

const isObjectSchema = (schema: JsonSchema): schema is ObjectJsonSchema => schema.type === 'object'

export function mapZodToJsonSchema(definition: SchemaDefinition): ReturnType<typeof transforms.zuiToJsonSchema> {
  const schema = transforms.zuiToJsonSchema(definition.schema, { target: 'jsonSchema7' })
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
