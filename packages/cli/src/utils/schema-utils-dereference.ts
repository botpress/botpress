import { dereference } from '@apidevtools/json-schema-ref-parser'
import { JSONSchema } from '@botpress/sdk'
import { runAsWorker } from 'synckit'

runAsWorker(async (schema: JSONSchema) => {
  const dereferencedSchema = await dereference(schema, { mutateInputSchema: false })
  return dereferencedSchema
})
