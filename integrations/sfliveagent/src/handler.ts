import { executeAgentNotTyping } from './events/agent-not-typing'
import { executeAgentTyping } from './events/agent-typing'
import { executeConversationAssigned } from './events/conversation-assigned'
import { executeConversationEnded } from './events/conversation-ended'
import { executeConversationRequestFailed } from './events/conversation-request-failed'
import { executeConversationRequestSuccess } from './events/conversation-request-success'
import { executeAgentMessage } from './events/agent-message'
import { executeQueueUpdated } from './events/queue-updated'
import type { TriggerPayload } from './triggers'
import { IntegrationProps } from '.botpress'
import { executeConversationTransferred } from './events/conversation-transferred'
import { Conversation, RuntimeError } from '@botpress/client'

export const findConversation = async (
  { client }: any,
  arg: { tags: any }
): Promise<Conversation | undefined> => {
  const { conversations } = await client.listConversations(arg)
  return conversations[0]
}

export const handler: IntegrationProps['handler'] = async ({ req, client, logger }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  console.log('Got Data on handler:', JSON.stringify(req.body))

  const trigger = JSON.parse(req.body) as TriggerPayload

  if(trigger.type == 'data ' && ( !trigger.payload || !(trigger.payload as unknown as string)?.length)) {
    return
  }

  if(['data', 'polling_end', 'error'].includes(trigger.type)) {

    console.log('will try to get using the following tags: ', { pollingKey: trigger.transport.key })

    const linkedConversation = await findConversation({ client }, {
      tags: {
        pollingKey: trigger.transport.key
      },
    })

    if(!linkedConversation) {
      throw new RuntimeError("Couldn't find the linked conversation in the handler")
    }

    console.log('Got conversation:', linkedConversation)

    const botpressConversationId = linkedConversation.tags.botpressConversationId
    const botpressUserId  = linkedConversation.tags.botpressUserId || ''

    if(!botpressConversationId) {
      throw new RuntimeError('Botpress conversation does not exist')
    }

    switch (trigger.type) {
      case 'data':

        //Polling microservice got some data
        //Data that will be sent by Chasitor docs: https://developer.salesforce.com/docs/atlas.en-us.live_agent_rest.meta/live_agent_rest/live_agent_rest_Messages_responses_overview.htm

        for(const payloadMessage of ( trigger?.payload?.messages || [])) {
          const { type, message } = payloadMessage
          // Process Message
          switch(type) {
            case 'ChatRequestFail': void executeConversationRequestFailed({ botpressConversationId, botpressUserId, message, client }); break
            case 'ChatRequestSuccess': void executeConversationRequestSuccess({ botpressConversationId, botpressUserId, client }); break
            case 'ChatEstablished': void executeConversationAssigned({ botpressConversationId, botpressUserId, message, client }); break
            case 'ChatTransferred': void executeConversationTransferred({ botpressConversationId, botpressUserId, message, client }); break
            case 'ChatMessage': void  executeAgentMessage({ botpressConversationId, botpressUserId, message, client }); break
            case 'AgentTyping': void executeAgentTyping({ botpressConversationId, botpressUserId, client }); break
            case 'AgentNotTyping': void executeAgentNotTyping({ botpressConversationId, botpressUserId, client }); break
            case 'QueueUpdate': void executeQueueUpdated({ botpressConversationId, botpressUserId, message, client }); break
            case 'ChatEnded': void executeConversationEnded({ botpressConversationId, botpressUserId, client, reason: message.reason === 'agent' ? 'AGENT_ENDED' : message.reason }); break
            default:
              logger.forBot().error('Unsupported message type: ' + JSON.stringify({ type, message }, null, 2))
          }
        }

        return

      case 'error':
        // If you start the polling session with debug enabled
        logger.forBot().debug('Got a debug error from the polling session: ' + JSON.stringify({ trigger, response: trigger.payload?.response }, null, 2))
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
