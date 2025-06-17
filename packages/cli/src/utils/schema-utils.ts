import { dereference } from '@apidevtools/json-schema-ref-parser'
import { z, transforms } from '@botpress/sdk'
import { JSONSchema7 } from 'json-schema'

type ZuiToJsonSchema = typeof transforms.toJSONSchemaLegacy
type JsonSchema = ReturnType<ZuiToJsonSchema>

type SchemaOptions = {
  title?: string
  examples?: any[]
}

type ZodObjectSchema = z.ZodObject | z.ZodRecord
type SchemaDefinition = {
  schema: ZodObjectSchema
  ui?: Record<string, SchemaOptions | undefined>
}

const isObjectSchema = (schema: JsonSchema): boolean => schema.type === 'object'

export async function mapZodToJsonSchema(
  definition: SchemaDefinition
): Promise<ReturnType<typeof transforms.toJSONSchemaLegacy>> {
  let schema = transforms.toJSONSchemaLegacy(definition.schema, { target: 'jsonSchema7' })
  schema = (await dereferenceSchema(schema)) as typeof schema

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

export const dereferenceSchema = async (schema: JSONSchema7): Promise<JSONSchema7> => {
  return dereference(schema, {
    resolve: {
      external: false,
      file: false,
      http: false,
    },
  })
}
