import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export { states } from './states'
export { actions } from './actions'

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
    email: {
      title: 'Email',
      description: 'Email address',
    },
  },
} satisfies IntegrationDefinitionProps['user']
