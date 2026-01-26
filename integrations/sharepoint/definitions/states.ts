import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({
      // key = documentLibraryName, value = {webhookSubscriptionId,changeToken}
      subscriptions: z.record(
        z.object({
          webhookSubscriptionId: z.string().min(1),
          changeToken: z.string().min(1),
        })
      ),
      folderKbMap: z
        .string()
        .min(1)
        .describe(
          'JSON map of kbId to array of folder prefixes for routing files to specific KBs. Example: {"kb-marketing":["Campaigns"],"kb-policies":["HR","Legal"]}'
        ),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
