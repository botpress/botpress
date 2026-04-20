import { z } from '@botpress/sdk'

export const recordResultSchema = z.object({
  id: z.string().optional().title('ID').describe('The ID of the created or updated record'),
  success: z.boolean().title('Success').describe('Whether the operation was successful'),
  error: z.string().optional().title('Error').describe('Error message if the operation failed'),
})

export type RecordResult = z.infer<typeof recordResultSchema>

export const searchOutputSchema = z.object({
  success: z.boolean().title('Success').describe('Whether the search was successful'),
  records: z
    .array(z.object({}).passthrough())
    .optional()
    .title('Records')
    .describe('The records returned by the search'),
  error: z.string().optional().title('Error').describe('Error message if the search failed'),
})

export type SearchOutput = z.infer<typeof searchOutputSchema>
