import { parseSchema } from '@bpinternal/json-schema-to-zod'
import { ZodTypeAny, z } from 'zod'

const jsonSchemaToZodStr = (schema: any): string => {
  return parseSchema(schema, {
    seen: new Map(),
    path: [],
  })
}

export const jsonSchemaToZod = (schema: any): ZodTypeAny => {
  let code = jsonSchemaToZodStr(schema)
  code = code.replaceAll('errors: z.ZodError[]', 'errors')
  return new Function('z', `return ${code}`)(z) as ZodTypeAny
}
