import { z, transforms } from '@botpress/sdk'

type SchemaOptions = {
  title?: string
  examples?: any[]
}

type SchemaDefinition = {
  schema: z.ZodObject<any>
  ui?: Record<string, SchemaOptions | undefined>
}

export function mapZodToJsonSchema(definition: SchemaDefinition): ReturnType<typeof transforms.zuiToJsonSchema> {
  return transforms.zuiToJsonSchema(definition.schema, { target: 'jsonSchema7' })
}
