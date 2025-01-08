import { z, IntegrationDefinitionProps, messages } from '@botpress/sdk'

export { states } from './states'

export const configuration = {
  schema: z.object({
    appId: z.string().min(1).title('App ID').describe('Teams application ID'),
    appPassword: z.string().min(1).title('App Password').describe('Teams application password'),
    tenantId: z.string().optional().title('Tenant ID').describe('Teams tenant ID'),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const channels = {
  channel: {
    title: 'Channel',
    description: 'Teams conversation channel',
    messages: { ...messages.defaults, markdown: messages.markdown },
    message: {
      tags: {
        id: {
          title: 'ID',
          description: 'Teams activity ID',
        },
      },
    },
    conversation: {
      tags: {
        id: {
          title: 'ID',
          description: 'Teams conversation ID',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']

export const user = {
  tags: {
    id: {
      title: 'ID',
      description: 'Teams user ID',
    },
  },
} satisfies IntegrationDefinitionProps['user']
