import { z, IntegrationDefinitionProps, messages } from '@botpress/sdk'
import { issueSchema } from './schemas'

export { actions } from './actions'
export { events } from './events'
export { states } from './states'
export * as schemas from './schemas'

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: z.object({
    displayName: z.string().optional().describe('The name displayed in message transmissions'),
    avatarUrl: z.string().optional().describe('The web address for the profile picture'),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const configurations = {
  apiKey: {
    title: 'API Key',
    description: 'Configure Linear with an API Key.',
    schema: z.object({
      apiKey: z.string().describe('The API key for Linear'),
      webhookSigningSecret: z
        .string()
        .secret()
        .title('Webhook Signing Secret')
        .describe('The secret key for verifying incoming Linear webhook events'),
    }),
  },
} satisfies IntegrationDefinitionProps['configurations']

export const channels = {
  issue: {
    messages: messages.defaults,
    message: {
      tags: {
        id: {},
      },
    },
    conversation: {
      creation: {
        enabled: true,
        requiredTags: [],
      },
      tags: {
        id: {},
        title: {},
        url: {},
        parentId: {},
        parentTitle: {},
        parentUrl: {},
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']

export const user = {
  tags: {
    id: {},
  },
} satisfies IntegrationDefinitionProps['user']

export const entities = {
  issue: {
    title: 'Issue',
    description: 'A linear issue',
    schema: issueSchema,
  },
} satisfies IntegrationDefinitionProps['entities']
