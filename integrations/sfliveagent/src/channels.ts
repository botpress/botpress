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

        const { state: { payload: liveAgentSession } } = await client.getState({
          type: 'conversation',
          id: conversation.id,
          name: 'liveAgentSession'
        })

        try {
          const salesforceClient = getSalesforceClient({ ...ctx.configuration as SFLiveagentConfig}, liveAgentSession)
          await salesforceClient.sendMessage(props.payload.text)
        } catch(err) {
          if((err as AxiosError)?.response?.status === 403) {
            // Session is no longer valid
            void executeConversationEnded({ conversation, client, reason: 'INVALID_SESSION' })
          }
          throw err
        }
      },
    },
  },
} satisfies IntegrationProps['channels']
