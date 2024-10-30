import '@botpress/client'
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
