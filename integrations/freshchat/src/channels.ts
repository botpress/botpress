import '@botpress/client'
import { IntegrationProps } from '.botpress'

export default {
  channel: {
    messages: {
      text: async ({ client, ctx, conversation, ...props }) => {
        /*

        try {
          const salesforceClient = getSalesforceClient({ ...ctx.configuration as SFLiveagentConfig}, liveAgentSession)
          await salesforceClient.sendMessage(props.payload.text)
        } catch(err) {
          throw err
        }*/
      },
    },
  },
} satisfies IntegrationProps['channels']
