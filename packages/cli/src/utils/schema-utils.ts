import { z, transforms } from '@botpress/sdk'
import type { JsonSchema7Type } from '@bpinternal/zod-to-json-schema/src/parseDef'
import type { JsonSchema7ObjectType } from '@bpinternal/zod-to-json-schema/src/parsers/object'

type SchemaOptions = {
  title?: string
  examples?: any[]
}

type SchemaDefinition = {
  schema: z.ZodObject<any>
  ui?: Record<string, SchemaOptions | undefined>
}

const isObjectSchema = (schema: JsonSchema7Type): schema is JsonSchema7ObjectType => (schema as any)?.type === 'object'

export function mapZodToJsonSchema(definition: SchemaDefinition): ReturnType<typeof transforms.zuiToJsonSchema> {
  const schema = transforms.zuiToJsonSchema(definition.schema, { target: 'jsonSchema7' })
  if (!isObjectSchema(schema) || !definition.ui) {
    return schema
  }

  for (const [key, value] of Object.entries(definition.ui ?? {})) {
    const property = schema.properties?.[key] as (JsonSchema7Type & { title?: string; examples?: any[] }) | undefined

    if (!property) {
      continue
    }

    if (!!value?.title) {
      property.title = value.title
    }

    if (!!value?.examples) {
      property.examples = value.examples
    }
  }

  return schema
}
