import { z } from '@botpress/sdk'

// Webhook schemas and types
const urlValidationSchema = z.object({
  event: z.literal('endpoint.url_validation'),
  payload: z.object({
    plainToken: z.string(),
  }),
})

const transcriptCompletedSchema = z.object({
  event: z.literal('recording.transcript_completed'),
  payload: z.object({
    object: z.object({
      uuid: z.string(),
      host_id: z.string(),
    }),
  }),
})

export const zoomWebhookSchema = z.discriminatedUnion('event', [urlValidationSchema, transcriptCompletedSchema])

export type TranscriptCompletedPayload = z.infer<typeof transcriptCompletedSchema>
