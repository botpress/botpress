import { dereference } from '@apidevtools/json-schema-ref-parser'
import * as sdk from '@botpress/sdk'
import { JSONSchema7 } from 'json-schema'

type ZuiToJsonSchema = typeof sdk.z.transforms.toJSONSchemaLegacy
type JsonSchema = ReturnType<ZuiToJsonSchema>

type SchemaOptions = {
  title?: string
  examples?: any[]
}

type SchemaDefinition = {
  schema: sdk.z.ZuiObjectOrRefSchema
  ui?: Record<string, SchemaOptions | undefined>
}

type MapSchemaOptions = {
  useLegacyZuiTransformer?: boolean
  toJSONSchemaOptions?: Partial<sdk.z.transforms.JSONSchemaGenerationOptions>
}

const isObjectSchema = (schema: JsonSchema): boolean => schema.type === 'object'

export async function mapZodToJsonSchema(
  definition: SchemaDefinition,
  options: MapSchemaOptions
): Promise<ReturnType<typeof sdk.z.transforms.toJSONSchemaLegacy>> {
  let schema: JSONSchema7
  if (options.useLegacyZuiTransformer) {
    schema = sdk.z.transforms.toJSONSchemaLegacy(definition.schema, {
      target: 'jsonSchema7',
      ...options.toJSONSchemaOptions,
    })
  } else {
    schema = sdk.z.transforms.toJSONSchema(definition.schema, options.toJSONSchemaOptions)
  }
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
