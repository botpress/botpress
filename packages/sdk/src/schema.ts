import type { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import type { JsonSchema7Type } from 'zod-to-json-schema/src/parseDef'
import type { JsonSchema7ObjectType } from 'zod-to-json-schema/src/parsers/object'
import { AnyZodObject } from './type-utils'

type SchemaOptions<T> = {
  title: string
  examples: T[]
}

type IsEmptyObject<T> = keyof T extends never ? true : false

type UiDefinition<TSchema extends AnyZodObject = AnyZodObject> = IsEmptyObject<z.infer<TSchema>> extends true
  ? Record<string, never>
  : {
      [K in keyof z.infer<TSchema>]: Partial<SchemaOptions<z.infer<TSchema>[K]>>
    }

export type SchemaDefinition<TSchema extends AnyZodObject = AnyZodObject> = {
  schema: TSchema
  ui?: Partial<UiDefinition<TSchema>>
}

type JsonSchemaPropertyType = JsonSchema7Type & { title?: string; examples?: any[] }
const isObjectSchema = (schema: JsonSchema7Type): schema is JsonSchema7ObjectType => (schema as any)?.type === 'object'

export function schemaDefinitionToJsonSchema(definition: SchemaDefinition): ReturnType<typeof zodToJsonSchema> {
  const schema = zodToJsonSchema(definition.schema, { errorMessages: true })
  if (!isObjectSchema(schema) || !definition.ui) {
    return schema
  }

  for (const [key, value] of Object.entries(definition.ui ?? {})) {
    const property = schema.properties?.[key] as JsonSchemaPropertyType | undefined

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
