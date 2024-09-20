import { z } from '@botpress/sdk'

const fieldSchema = z.object({ name: z.string(), type: z.string() }).passthrough()

const viewSchema = z.object({ id: z.string(), name: z.string(), type: z.string() }).passthrough()

const tableSchema = z.object({
  description: z.string().optional(),
  fields: z.array(fieldSchema),
  id: z.string(),
  name: z.string(),
  primaryFieldId: z.string(),
  views: z.array(viewSchema),
})

const recordSchema = z.object({
  _rawJson: z.object({}).passthrough(),
  id: z.string(),
})

export { tableSchema, recordSchema }
