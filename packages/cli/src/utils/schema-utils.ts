import * as jex from '@bpinternal/jex'
import zodToJsonSchema from '@bpinternal/zod-to-json-schema'
import type { JsonSchema7Type } from '@bpinternal/zod-to-json-schema/src/parseDef'
import type { JsonSchema7ObjectType } from '@bpinternal/zod-to-json-schema/src/parsers/object'
import { JSONSchema7 } from 'json-schema'
import { z } from 'zod'

type SchemaOptions = {
  title?: string
  examples?: any[]
}

type SchemaDefinition = {
  schema: z.ZodObject<any>
  ui?: Record<string, SchemaOptions | undefined>
}

const isObjectSchema = (schema: JsonSchema7Type): schema is JsonSchema7ObjectType => (schema as any)?.type === 'object'

export function mapZodToJsonSchema(definition: SchemaDefinition): ReturnType<typeof zodToJsonSchema> {
  const schema = zodToJsonSchema(definition.schema, { errorMessages: true })
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

export function zodExtends(zChild: z.ZodObject<any>, zParent: z.ZodObject<any>) {
  const childSchema = zodToJsonSchema(zChild) as JSONSchema7
  const parentSchema = zodToJsonSchema(zParent) as JSONSchema7
  return jex.jsonSchemaExtends(childSchema, parentSchema)
}
