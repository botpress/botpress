import { getSalesforceClient } from 'src/client'
import { SFLiveagentConfig } from 'src/definitions/schemas'
import { IntegrationProps } from '.botpress'

export const createConversationSession: IntegrationProps['actions']['createConversationSession'] = async ({ ctx, client }) => {

  // get the webhook url from this integration
  const pollingMSState = await client.getState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'pollingMs'
  })

  const salesforceClient = getSalesforceClient({ ...ctx.configuration as SFLiveagentConfig })

  await salesforceClient.createSession()

  const session = salesforceClient.getCurrentSession()

  if(!session) {
    throw new Error('Failed to create Session')
  }

  try {
    // Start Polling Session using our transport-translator service
    await salesforceClient.startPolling({ webhook: { url: pollingMSState.state.payload.webhookUrl } })

    if(!session.pollingKey) {
      throw new Error('Polling Key not valid')
    }
  } catch(e) {
    salesforceClient.endSession('POLLING_SERVER_FAILED')

    throw new Error('Failed to create Polling Session')
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      pollingKey: session.pollingKey
    }
  })

  await client.getOrCreateUser({
    tags: {
      pollingKey: session.pollingKey
    },
  })

  await client.setState({
    type: 'conversation',
    id: conversation.id,
    name: 'liveAgentSession',
    payload: session
  })

  return session
}
