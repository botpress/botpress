import { z } from '@botpress/sdk'

export const notifState = {
  type: 'conversation' as const,
  schema: z.object({
    lastReadAt: z.string().optional(),
    lastRefreshedAt: z.string().optional(),
  }),
}
