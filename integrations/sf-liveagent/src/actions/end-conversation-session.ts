import { getSalesforceClient } from 'src/client'
import { SFLiveagentConfig } from 'src/definitions/schemas'
import { IntegrationProps } from '.botpress'

export const endConversationSession: IntegrationProps['actions']['endConversationSession'] = async ({ ctx, input, client }) => {

  const { state: { payload: liveAgentSession } } = await client.getState({
    type: 'conversation',
    id: input.conversationId,
    name: 'liveAgentSession'
  })

  const salesforceClient = getSalesforceClient({...ctx.configuration as SFLiveagentConfig}, liveAgentSession)
  await salesforceClient.endSession(input.reason)

  return {}
}
