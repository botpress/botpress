import { getSalesforceClient } from 'src/client'
import { SFLiveagentConfig } from 'src/definitions/schemas'
import { IntegrationProps } from '.botpress'

export const startChat: IntegrationProps['actions']['startChat'] = async ({ ctx, client, input, logger }) => {

  try {
    const { liveAgentSessionKey, userName } = input

    const { conversation: linkedConversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        liveAgentSessionKey
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

    const salesforceClient = getSalesforceClient({ ...ctx.configuration as SFLiveagentConfig }, liveAgentSession)

    await salesforceClient.startChat({ userName })
  } catch (e) {
    logger.forBot().error('Failed to create conversation session: ' + e.message)
    return { success: false, message: 'Failed to startChat: ' + e.message }
  }

  return { success: true }
}
