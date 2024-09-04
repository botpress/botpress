import { getSalesforceClient } from 'src/client'
import { SFLiveagentConfig } from 'src/definitions/schemas'
import { IntegrationProps } from '.botpress'
import { Conversation } from '@botpress/client'

const findConversation = async (
  { client }: any,
  arg: { tags: any }
): Promise<Conversation | undefined> => {
  const { conversations } = await client.listConversations(arg)
  return conversations[0]
}

export const endConversationSession: IntegrationProps['actions']['endConversationSession'] = async ({ ctx, input, client, logger }) => {

  try {
    const linkedConversation = await findConversation({ client }, {
      tags: { liveAgentSessionKey: input.liveAgentSessionKey }
    })

    console.log('Got Linked conversation while endConversation: ', {linkedConversation})

    if(!linkedConversation || !linkedConversation.tags.botpressConversationId) {
      throw new Error('Linked conversation does not exist')
    }

    const { state: { payload: liveAgentSession } } = await client.getState({
      type: 'conversation',
      id: linkedConversation.id,
      name: 'liveAgentSession'
    })

    const salesforceClient = getSalesforceClient(logger,{...ctx.configuration as SFLiveagentConfig}, liveAgentSession)
    await salesforceClient.endSession(input.reason)
  } catch (e) {
    logger.forBot().error('Failed to create conversation session: ' + e.message)
    return { success: false, message: 'Failed to endConversationSession: ' + e.message }
  }

  return { success: true }
}
