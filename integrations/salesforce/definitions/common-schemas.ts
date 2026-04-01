import { z } from '@botpress/sdk'

export const recordResultSchema = z.object({
  id: z.string().optional(),
  success: z.boolean(),
  error: z.string().optional(),
})

export type RecordResult = z.infer<typeof recordResultSchema>

export const searchOutputSchema = z.object({
  success: z.boolean(),
  records: z.array(z.object({}).passthrough()).optional(),
  error: z.string().optional(),
})

export type SearchOutput = z.infer<typeof searchOutputSchema>
