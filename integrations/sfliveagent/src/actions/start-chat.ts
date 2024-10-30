import { getSalesforceClient } from 'src/client'
import { SFLiveagentConfig } from 'src/definitions/schemas'
import { IntegrationProps } from '.botpress'
import { RuntimeError } from '@botpress/client'
import { findConversation } from '../handler'

export const startChat: IntegrationProps['actions']['startChat'] = async ({ ctx, client, input, logger }) => {

  try {
    const { liveAgentSessionKey, ...rest } = input

    logger.forBot().debug('will start chat using key: ' + liveAgentSessionKey)

    const linkedConversation = await findConversation({ client }, {
      tags: { liveAgentSessionKey }
    })

    console.log('Got Linked conversation while startChat: ', {linkedConversation})

    console.log('Start Chat, found conversation: ', { linkedConversation })

    if(!linkedConversation || !linkedConversation.tags.botpressConversationId) {
      throw new RuntimeError(`Linked conversation does not exist for key ${liveAgentSessionKey}, please execute listen-conversation first`)
    }

    const { state: { payload: liveAgentSession } } = await client.getState({
      type: 'conversation',
      id: linkedConversation.id,
      name: 'liveAgentSession'
    })

    const salesforceClient = getSalesforceClient(logger, { ...ctx.configuration as SFLiveagentConfig }, liveAgentSession)

    await salesforceClient.startChat(rest)
  } catch (err: any) {
    logger.forBot().error('Failed to start chat: ' + err.message)
    return { success: false, message: 'Failed to startChat: ' + err.message }
  }

  return { success: true }
}
