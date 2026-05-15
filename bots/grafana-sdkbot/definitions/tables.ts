import { z } from '@botpress/sdk'

export const tables = {
  alertSubscriptionsTable: {
    schema: z.object({
      botpressId: z.string(),
      conversationId: z.string(),
    }),
  },
  alertNotificationsTable: {
    schema: z.object({
      notifId: z.string(),
      conversationId: z.string(),
      alertName: z.string(),
      status: z.string(),
      receivedAt: z.string(),
    }),
  },
}
