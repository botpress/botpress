import { getSalesforceClient } from 'src/client'
import { SFLiveagentConfig } from 'src/definitions/schemas'
import { IntegrationProps } from '.botpress'
import console from 'node:console'

export const endConversationSession: IntegrationProps['actions']['endConversationSession'] = async ({ ctx, input, client, logger }) => {

  try {
    // Get Conversation that links the botpress conversation to the liveAgent conversation
    const { conversation: linkedConversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        liveAgentSessionKey: input.liveAgentSessionKey
      }
    })

    if(!linkedConversation || !linkedConversation.tags.botpressConversationId) {
      throw new Error('Linked conversation does not exist')
    }

    const { state: { payload: liveAgentSession } } = await client.getState({
      type: 'conversation',
      id: linkedConversation.id,
      name: 'liveAgentSession'
    })

    const salesforceClient = getSalesforceClient({...ctx.configuration as SFLiveagentConfig}, liveAgentSession)
    await salesforceClient.endSession(input.reason)
  } catch (e) {
    logger.forBot().error('Failed to create conversation session: ' + e.message)
    return { success: false, message: 'Failed to endConversationSession: ' + e.message }
  }

  return { success: true }
}
