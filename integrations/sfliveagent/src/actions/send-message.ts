import { getSalesforceClient } from 'src/client'
import { IntegrationProps } from '../../.botpress'
import { SFLiveagentConfig } from '../definitions/schemas'
import { AxiosError } from 'axios'
import { executeConversationEnded } from '../events/conversation-ended'
import { Conversation, RuntimeError } from '@botpress/client'

const findConversation = async (
  { client }: any,
  arg: { tags: any }
): Promise<Conversation | undefined> => {
  const { conversations } = await client.listConversations(arg)
  return conversations[0]
}

export const sendMessage: IntegrationProps['actions']['sendMessage'] = async ({ ctx, client, input, logger }) => {

  let payload
  let linkedConversation

  try {
    payload = JSON.parse(input.payload)
  } catch (e: any) {
    payload = { text: 'invalid payload from user message: ' + e.message }
  }

  try {

    // Get Conversation that links the botpress conversation to the liveAgent conversation
    linkedConversation = await findConversation({ client }, {
      tags: { liveAgentSessionKey: input.liveAgentSessionKey }
    })

    console.log('Got Linked conversation while sendingMessage: ', {linkedConversation})

    if(!linkedConversation || !linkedConversation.tags.botpressConversationId) {
      throw new RuntimeError('Linked conversation does not exist')
    }

    const { state: { payload: liveAgentSession } } = await client.getState({
      type: 'conversation',
      id: linkedConversation.id,
      name: 'liveAgentSession'
    })

    const salesforceClient = getSalesforceClient(logger, { ...ctx.configuration as SFLiveagentConfig}, liveAgentSession)
    await salesforceClient.sendMessage(payload.text)
  } catch (err: any) {
    logger.forBot().error('Failed to create conversation session: ' + err.message)

    if((err as AxiosError)?.response?.status === 403) {
      // Session is no longer valid
      if(linkedConversation && linkedConversation.tags.botpressConversationId) {
        void executeConversationEnded({ botpressConversationId: linkedConversation.tags.botpressConversationId, client, reason: 'INVALID_SESSION' })
      }
    }

    return { success: false, message: 'Failed to sendMessage: ' + err.message }
  }

  return { success: true }
}
