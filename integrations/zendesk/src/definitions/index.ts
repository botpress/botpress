import { z, IntegrationDefinitionProps } from '@botpress/sdk'

const SHARED_CONFIGURATION = {
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
  ignoreNonHitlTickets: z
    .boolean()
    .optional()
    .title('Ignore non-HITL tickets')
    .describe('Ignore tickets that were not created by the startHitl action'),
} as const

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
} satisfies IntegrationDefinitionProps['events']

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: z.object(SHARED_CONFIGURATION),
} satisfies IntegrationDefinitionProps['configuration']

export const identifier = {
  extractScript: 'extract.vrl',
  fallbackHandlerScript: 'fallbackHandler.vrl',
} as const satisfies IntegrationDefinitionProps['identifier']

export const configurations = {
  manual: {
    title: 'Manual configuration',
    description: 'Configure by manually supplying the refresh token and signing secret',
    schema: z.object({
      ...SHARED_CONFIGURATION,
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
    }),
  },
} as const satisfies IntegrationDefinitionProps['configurations']

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
  oauth: {
    type: 'integration',
    schema: z.object({
      accessToken: z.string().optional().title('Access token').describe('The access token obtained by OAuth'),
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
