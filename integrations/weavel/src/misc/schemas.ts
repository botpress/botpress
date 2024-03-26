import z from 'zod'

export const captureTraceDataInputSchema = z.object({
  conversationId: z.string(),
  type: z.enum(['user', 'assistant']),
  content: z.string(),
  metadata: z.string().optional(),
})

export const captureTrackEventInputSchema = z.object({
  name: z.string(),
  properties: z.string().optional(),
})

export const openTraceInputSchema = z.object({
  conversationId: z.string(),
  metadata: z.string().optional(),
})
