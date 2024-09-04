import { getSalesforceClient } from 'src/client'
import { SFLiveagentConfig } from 'src/definitions/schemas'
import { IntegrationProps } from '.botpress'

export const createConversationSession: IntegrationProps['actions']['createConversationSession'] = async ({ ctx, client, logger }) => {

  console.log('executing createConversationSession with args: ')

  try {
    // get the webhook url from this integration
    const pollingMSState = await client.getState({
      type: 'integration',
      id: ctx.integrationId,
      name: 'pollingMs'
    })

    console.log({pollingMSState})

    const salesforceClient = getSalesforceClient(logger,{ ...ctx.configuration as SFLiveagentConfig })

    await salesforceClient.createSession()

    const session = salesforceClient.getCurrentSession()

    console.log('got session', {session})

    if(!session) {
      throw new Error('Failed to create Session')
    }

    const { conversation } = await client.createConversation({
      channel: 'channel',
      tags: {
        liveAgentSessionKey: session.sessionKey
      }
    })

    console.log('Created conversation: ', {conversation})

    await client.setState({
      type: 'conversation',
      id: conversation.id,
      name: 'liveAgentSession',
      payload: session
    })

    console.log('Set State')

    return { success: true, liveAgentSessionKey: session.sessionKey }
  } catch (e: any) {
    logger.forBot().error('Failed to create conversation session: ' + e.message)
    return { success: false, message: 'Failed to create conversation session: ' + e.message }
  }
}
