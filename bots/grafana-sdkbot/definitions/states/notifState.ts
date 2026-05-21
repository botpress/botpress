import { z } from '@botpress/sdk'

export const notifState = {
  type: 'conversation' as const,
  schema: z.object({
    lastReadAt: z
      .string()
      .title('Last Read At')
      .describe('ISO timestamp of the last alert notification read by the user')
      .optional(),
    lastRefreshedAt: z
      .string()
      .title('Last Refreshed At')
      .describe('ISO timestamp of the last alert poll against the Grafana API')
      .optional(),
  }),
}
