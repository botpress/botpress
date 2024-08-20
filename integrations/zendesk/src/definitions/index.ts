import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export { actions } from './actions'
export { channels } from './channels'

export const events = {
  articlePublished: {
    title: 'Article Published',
    description: 'Triggered when an article is published',
    schema: z.object({
      articleId: z.string(),
      articleTitle: z.string(),
    }),
    ui: {},
  },
  articleUnpublished: {
    title: 'Article Unpublished',
    description: 'Triggered when an article is unpublished',
    schema: z.object({
      articleId: z.string(),
    }),
    ui: {},
  },
} satisfies IntegrationDefinitionProps['events']

export const configuration = {
  schema: z.object({
    organizationSubdomain: z
      .string({
        description: 'Your zendesk organization subdomain. e.g. botpress7281',
      })
      .min(1),
    email: z
      .string({
        description: 'Your zendesk account email. e.g. john.doe@botpress.com',
      })
      .email(),
    apiToken: z
      .string({
        description: 'Zendesk API Token',
      })
      .min(1),
    syncKnowledgeBaseWithBot: z
      .boolean({
        description: 'Would you like to sync Zendesk Knowledge Base into Bot Knowledge Base?',
      })
      .optional(),
    knowledgeBaseId: z
      .string({
        description: 'ID of the Knowledge Base you wish to synchronize with your Zendesk KB',
      })
      .optional(),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  subscriptionInfo: {
    type: 'integration',
    schema: z.object({
      subscriptionId: z.string(),
      triggerIds: z.array(z.string()),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    id: {},
    email: {},
    role: {},
  },
} satisfies IntegrationDefinitionProps['user']
