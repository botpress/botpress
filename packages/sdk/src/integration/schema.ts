// TODO: https://github.com/botpress/zod-to-json-schema
// zod-to-json-schema currently doesn't support the "discriminator" keyword and only uses "anyOf" for unions
// Once this is fixed, we can remove our fork and use the package directly
import zodToJsonSchema from '@bpinternal/zod-to-json-schema'
import type { JsonSchema7Type } from '@bpinternal/zod-to-json-schema/src/parseDef'
import type { JsonSchema7ObjectType } from '@bpinternal/zod-to-json-schema/src/parsers/object'
import type { z } from 'zod'

type JsonSchemaPropertyType = JsonSchema7Type & { title?: string; examples?: any[] }
const isObjectSchema = (schema: JsonSchema7Type): schema is JsonSchema7ObjectType => {
  return (schema as any)?.type === 'object'
}

export type SchemaOptions<T> = {
  title: string
  examples: T[]
}

type IsEmptyObject<T> = keyof T extends never ? true : false

export type UiDefinition<TSchema extends z.ZodObject<any>> = IsEmptyObject<z.infer<TSchema>> extends true
  ? Record<string, never>
  : {
      [K in keyof z.infer<TSchema>]: Partial<SchemaOptions<z.infer<TSchema>[K]>>
    }

export type SchemaDefinition<TSchema extends z.ZodObject<any>> = {
  schema: TSchema
  ui?: Partial<UiDefinition<TSchema>>
}

export function schemaDefinitionToJsonSchema(
  definition: SchemaDefinition<z.ZodObject<any>>
): ReturnType<typeof zodToJsonSchema> {
  const schema = zodToJsonSchema(definition.schema, {
    $refStrategy: 'none',
    errorMessages: true,
    unionStrategy: 'oneOf',
    discriminator: true,
  })
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
