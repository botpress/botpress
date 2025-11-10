import { z } from '@botpress/sdk'
import { channelAccountSchema } from 'definitions/states'

export const teamsActivitySchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.string(),
    from: channelAccountSchema.passthrough().partial().optional(),
    conversation: z
      .object({
        id: z.string().trim().min(1),
      })
      .passthrough(),
    text: z.string().optional(),
  })
  .passthrough()
