import { getSalesforceClient } from '../client'
import { SFLiveagentConfig } from '../definitions/schemas'
import { IntegrationProps } from '../../.botpress'

export const listenConversation: IntegrationProps['actions']['listenConversation'] = async ({ ctx, client, input, logger }) => {

  try {
    const { botpressConversationId, liveAgentSessionKey } = input;

    if(!liveAgentSessionKey?.length) {
      logger.forBot().error(`Invalid Live Agent Session Key for listen: ${liveAgentSessionKey}, please specify a valid one.`)
      return { success: false };
    }

    if(!botpressConversationId?.length) {
      logger.forBot().error(`Invalid Botpress conversation for listen: ${botpressConversationId}, please specify a valid one.`)
      return { success: false };
    }

    // get the webhook url from this integration
    const pollingMSState = await client.getState({
      type: 'integration',
      id: ctx.integrationId,
      name: 'pollingMs'
    })

    // Get Conversation that links the botpress conversation to the chasitor conversation
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
    let pollingKey;

    try {
      // Start Polling Session using our transport-translator service
      await salesforceClient.startPolling({ webhook: { url: pollingMSState.state.payload.webhookUrl } })
      pollingKey = salesforceClient.getCurrentSession()?.pollingKey

      if(!pollingKey) {
        throw new Error('Polling Key not valid')
      }
    } catch(e) {
      salesforceClient.endSession('POLLING_SERVER_FAILED')

      return { success: false, message: 'Failed to create Polling Session: ' + e.message }
    }

    client.updateConversation({
      id: linkedConversation.id,
      tags: {
        pollingKey,
        botpressConversationId
      }
    })
  } catch (e) {
    logger.forBot().error('Failed to create conversation session: ' + e.message)
    return { success: false, message: 'Failed to listenConversation: ' + e.message }
  }

  return { success: true, pollingKey }
}
