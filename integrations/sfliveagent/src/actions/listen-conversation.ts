import { getSalesforceClient } from '../client'
import { SFLiveagentConfig } from '../definitions/schemas'
import { IntegrationProps } from '../../.botpress'
import { Conversation } from '@botpress/client'

export const listenConversation: IntegrationProps['actions']['listenConversation'] = async ({ ctx, client, input, logger }) => {

  const findConversation = async (
    { client }: any,
    arg: { tags: any }
  ): Promise<Conversation | undefined> => {
    const { conversations } = await client.listConversations(arg)
    return conversations[0]
  }

  try {
    const { botpressConversationId, botpressUserId,  liveAgentSessionKey } = input;

    console.log('Will listen conversation:  ', { botpressConversationId, liveAgentSessionKey })

    if(!liveAgentSessionKey?.length) {
      logger.forBot().error(`Invalid Live Agent Session Key for listen: ${liveAgentSessionKey}, please specify a valid one.`)
      return { success: false }
    }

    if(!botpressConversationId?.length) {
      logger.forBot().error(`Invalid Botpress conversation for listen: ${botpressConversationId}, please specify a valid one.`)
      return { success: false }
    }

    // get the webhook url from this integration
    const pollingMSState = await client.getState({
      type: 'integration',
      id: ctx.integrationId,
      name: 'pollingMs'
    })

    // Get Conversation that links the botpress conversation to the chasitor conversation
    const linkedConversation = await findConversation({ client }, {
      tags: { liveAgentSessionKey }
    })

    console.log('found conversation: ', { liveAgentSessionKey })

    if(!linkedConversation || !linkedConversation.tags.liveAgentSessionKey) {
      throw new Error('Linked conversation does not exist')
    }

    const { state: { payload: liveAgentSession } } = await client.getState({
      type: 'conversation',
      id: linkedConversation.id,
      name: 'liveAgentSession'
    })

    const salesforceClient = getSalesforceClient(logger,{ ...ctx.configuration as SFLiveagentConfig }, liveAgentSession)
    let pollingKey

    try {
      // Start Polling Session using our transport-translator service
      await salesforceClient.startPolling({ webhook: { url: pollingMSState.state.payload.webhookUrl } })
      pollingKey = salesforceClient.getCurrentSession()?.pollingKey

      if(!pollingKey) {
        throw new Error('Polling Key not valid')
      }
    } catch(e: any) {
      await salesforceClient.endSession('POLLING_SERVER_FAILED')

      return { success: false, message: 'Failed to end Polling Session: ' + e.message }
    }

    await client.updateConversation({
      id: linkedConversation.id,
      tags: {
        pollingKey,
        liveAgentSessionKey,
        botpressConversationId,
        botpressUserId
      }
    })
  } catch (e: any) {
    logger.forBot().error('Failed to create conversation session: ' + e.message)
    return { success: false, message: 'Failed to listenConversation: ' + e.message }
  }

  return { success: true }
}
