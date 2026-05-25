import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({
      subscriptions: z
        .record(
          z.object({
            webhookSubscriptionId: z.string().min(1),
            changeToken: z.string().min(1),
            itemPathCache: z
              .record(
                z.object({
                  absolutePath: z.string(),
                  name: z.string(),
                })
              )
              .default({}),
            expiresAt: z.string().optional().describe('ISO 8601 expiry date of the SharePoint webhook subscription.'),
          })
        )
        .title('Webhook Subscriptions')
        .describe('Active SharePoint webhook subscriptions keyed by document library name.'),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
