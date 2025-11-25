import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export { actions } from './actions'
export { channels } from './channels'

export const events = {
  articlePublished: {
    title: 'Article Published',
    description: 'Triggered when an article is published',
    schema: z.object({
      articleId: z.string().title('Article ID').describe('The unique identifier of the published article'),
      articleTitle: z.string().title('Article Title').describe('The title of the published article'),
    }),
    ui: {},
  },
  articleUnpublished: {
    title: 'Article Unpublished',
    description: 'Triggered when an article is unpublished',
    schema: z.object({
      articleId: z.string().title('Article ID').describe('The unique identifier of the unpublished article'),
    }),
    ui: {},
  },
  conversationStarted: {
    title: 'Conversation Started',
    description: 'This event occurs when a user activates the Zendesk widget, prompting the interface to appear.',
    schema: z.object({
      userId: z.string().title('User ID').describe('The Botpress user ID'),
      conversationId: z.string().title('Conversation ID').describe('The Botpress conversation ID'),
    }),
    ui: {},
  },
} satisfies IntegrationDefinitionProps['events']

export const configuration = {
  schema: z.object({
    organizationSubdomain: z
      .string()
      .min(1)
      .title('Organization Subdomain')
      .describe('Your zendesk organization subdomain. e.g. botpress7281'),
    email: z.string().email().title('Email').describe('Your zendesk account email. e.g. john.doe@botpress.com'),
    apiToken: z.string().min(1).title('API Token').describe('Zendesk API Token'),
    syncKnowledgeBaseWithBot: z
      .boolean()
      .optional()
      .title('Sync Knowledge Base')
      .describe('Would you like to sync Zendesk Knowledge Base into Bot Knowledge Base?'),
    knowledgeBaseId: z
      .string()
      .optional()
      .title('Knowledge Base ID')
      .describe('ID of the Knowledge Base you wish to synchronize with your Zendesk KB'),
    ignoreNonHitlTickets: z
      .boolean()
      .optional()
      .title('Ignore non-HITL tickets')
      .describe('Ignore tickets that were not created by the startHitl action'),
    messagingAppId: z
      .string()
      .min(1)
      .optional()
      .title('Messaging App ID')
      .describe('App ID from your "Conversations API"'),
    messagingKeyId: z
      .string()
      .min(1)
      .optional()
      .title('Messaging Key ID')
      .describe('Key ID from your "Conversations API"'),
    messagingKeySecret: z
      .string()
      .min(1)
      .optional()
      .title('Messaging Key Secret')
      .describe('Key Secret from your "Conversations API"'),
    messagingWebhookSecret: z
      .string()
      .optional()
      .title('Messaging Webhook Secret')
      .describe('Webhook Secret from your "Conversations Integration"'),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  subscriptionInfo: {
    type: 'integration',
    schema: z.object({
      subscriptionId: z
        .string()
        .title('Subscription ID')
        .describe('The unique identifier for the Zendesk webhook subscription'),
      triggerIds: z
        .array(z.string())
        .title('Trigger IDs')
        .describe('Array of trigger IDs associated with the subscription'),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    id: {
      title: 'User ID',
      description: 'The unique identifier of the Zendesk user',
    },
    email: {
      title: 'Email',
      description: 'The email address of the Zendesk user',
    },
    role: {
      title: 'Role',
      description: 'The role of the Zendesk user (end-user, agent, or admin)',
    },
  },
} satisfies IntegrationDefinitionProps['user']
