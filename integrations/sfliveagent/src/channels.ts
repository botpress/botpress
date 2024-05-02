import '@botpress/client'
import { AxiosError } from 'axios'
import { getSalesforceClient } from './client'
import { SFLiveagentConfig } from './definitions/schemas'
import { executeConversationEnded } from './events/conversation-ended'
import { IntegrationProps } from '.botpress'

export default {
  channel: {
    messages: {
      text: async ({ client, ctx, conversation, ...props }) => {
        console.log('tried to send message in the channel, not supported')
      },
    },
  },
} satisfies IntegrationProps['channels']
