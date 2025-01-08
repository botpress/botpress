import { z, IntegrationDefinitionProps, messages, ConfigurationDefinition } from '@botpress/sdk'
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
    displayName: z.string().optional().title('Display Name').describe('The name displayed in message transmissions'),
    avatarUrl: z.string().optional().title('Avatar URL').describe('The web address for the profile picture'),
  }),
} as const satisfies ConfigurationDefinition

export const configurations = {
  apiKey: {
    title: 'API Key',
    description: 'Configure Linear with an API Key.',
    schema: z.object({
      apiKey: z.string().title('API Key').describe('The API key for Linear'),
      webhookSigningSecret: z
        .string()
        .secret()
        .title('Webhook Signing Secret')
        .describe('The secret key for verifying incoming Linear webhook events'),
    }),
  },
} as const satisfies IntegrationDefinitionProps['configurations']

export const channels = {
  issue: {
    title: 'Issue',
    description: 'A linear issue',
    messages: { ...messages.defaults, markdown: messages.markdown },
    message: {
      tags: {
        id: {
          title: 'Comment ID',
          description: 'The ID of the comment on Linear',
        },
      },
    },
    conversation: {
      tags: {
        id: {
          title: 'Issue ID',
          description: 'The ID of the issue on Linear',
        },
        title: {
          title: 'Issue Title',
          description: 'The title of the issue',
        },
        url: {
          title: 'Issue URL',
          description: 'The URL of the issue on Linear',
        },
        parentId: {
          title: 'Parent Issue ID',
          description: 'The ID of the parent issue on Linear',
        },
        parentTitle: {
          title: 'Parent Issue Title',
          description: 'The title of the parent issue',
        },
        parentUrl: {
          title: 'Parent Issue URL',
          description: 'The URL of the parent issue on Linear',
        },
      },
    },
  },
} as const satisfies IntegrationDefinitionProps['channels']

export const user = {
  tags: {
    id: {
      title: 'User ID',
      description: 'The ID of the user on Linear',
    },
  },
} as const satisfies IntegrationDefinitionProps['user']

export const entities = {
  issue: {
    title: 'Issue',
    description: 'A linear issue',
    schema: issueSchema,
  },
} as const satisfies IntegrationDefinitionProps['entities']
