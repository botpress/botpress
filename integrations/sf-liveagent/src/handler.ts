
import { executeAgentNotTyping } from './events/agent-not-typing'
import { executeAgentTyping } from './events/agent-typing'
import { executeConversationAssigned } from './events/conversation-assigned'
import { executeConversationEnded } from './events/conversation-ended'
import { executeConversationRequestFailed } from './events/conversation-request-failed'
import { executeConversationRequestSuccess } from './events/conversation-request-success'
import { executeQueueUpdated } from './events/queue-updated'
import type { TriggerPayload } from './triggers'
import { IntegrationProps } from '.botpress'

export const handler: IntegrationProps['handler'] = async ({ req, client, logger }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  const trigger = JSON.parse(req.body) as TriggerPayload

  if(['data', 'polling_start', 'polling_end', 'error'].includes(trigger.type)) {

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        pollingKey: trigger.transport.key
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        pollingKey: trigger.transport.key
      },
    })


    switch (trigger.type) {
      case 'data':

        //Polling microservice got some data
        //Data that will be sent by Chasitor docs: https://developer.salesforce.com/docs/atlas.en-us.live_agent_rest.meta/live_agent_rest/live_agent_rest_Messages_responses_overview.htm

        for(const payloadMessage of ( trigger?.payload?.messages || [])) {
          const { type, message } = payloadMessage
          // Process Message
          switch(type) {
            case 'ChatRequestFail': void executeConversationRequestFailed({ conversation, message, client }); break
            case 'ChatRequestSuccess': void executeConversationRequestSuccess({ conversation, client }); break
            case 'ChatEstablished': void executeConversationAssigned({ conversation, message, client }); break
            case 'ChatMessage': void client.createMessage({
              tags: { origin: 'Salesforce LiveAgent' },
              type: 'text',
              userId: user.id,
              conversationId: conversation.id,
              payload: { text: message.text },
            }); break
            case 'AgentTyping': void executeAgentTyping({ conversation, client }); break
            case 'AgentNotTyping': void executeAgentNotTyping({ conversation, client }); break
            case 'QueueUpdate': void executeQueueUpdated({ conversation, message, client }); break
            case 'ChatEnded': void executeConversationEnded({ conversation, client, reason: message.reason === 'agent' ? 'AGENT_ENDED' : message.reason }); break
            default:
              logger.forBot().error('Unsupported message type: ' + JSON.stringify({ type, message }, null, 2))
          }
        }

        return

      case 'error':
        // If you start the polling session with debug enabled
        logger.forBot().error('Got a debug error from the polling session: ' + JSON.stringify({ trigger, response: trigger.payload?.response }, null, 2))
        return
      case 'polling_start':
        return
      case 'polling_end':
        return
      default: break
    }
  } else {
    logger.forBot().warn('Unsupported trigger type: ' + trigger.type)
  }
}
