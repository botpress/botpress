import { z } from '@botpress/sdk'
import { channelAccountSchema } from '../definitions/states'

export const teamsActivitySchema = z
  .object({
    id: z.string().trim().min(1),
    type: z.string(),
    from: channelAccountSchema.passthrough(),
    conversation: z
      .object({
        id: z.string().trim().min(1),
      })
      .passthrough(),
    text: z.string(),
  })
  .passthrough()
