import { z } from '@botpress/sdk'

const fieldSchema = z.object({ name: z.string(), type: z.string() }).passthrough()

const viewSchema = z.object({ id: z.string(), name: z.string(), type: z.string() }).passthrough()

const tableSchema = z.object({
  description: z.string().optional().describe('The description of the table').title('description'),
  fields: z.array(fieldSchema).describe('The fields of the table').title('Fields'),
  id: z.string().describe('The ID of the table').title('ID'),
  name: z.string().describe('The name of the table').title('Name'),
  primaryFieldId: z.string().describe('The first column in the table and every view').title('Primary Field ID'),
  views: z.array(viewSchema).describe('The views of the table').title('Views'),
})

const recordSchema = z.object({
  fields: z.record(z.any()).describe('The fields of the Record').title('Fields'),
  id: z.string().describe('The ID of the Record').title('ID'),
})

export { tableSchema, recordSchema }
