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

export const startChat: IntegrationProps['actions']['startChat'] = async ({ ctx, client, input, logger }) => {

  try {
    const { liveAgentSessionKey, userName } = input

    logger.forBot().error('will start chat using key: ' + liveAgentSessionKey)

    const linkedConversation = await findConversation({ client }, {
      tags: { liveAgentSessionKey }
    })

    console.log('Got Linked conversation while startChat: ', {linkedConversation})

    console.log('Start Chat, found conversation: ', { linkedConversation })

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
  } catch (err) {
    logger.forBot().error('Failed to start chat: ' + err.message)
    return { success: false, message: 'Failed to startChat: ' + err.message }
  }

  return { success: true }
}
