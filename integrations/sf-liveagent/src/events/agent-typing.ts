import { Conversation } from '@botpress/client'
import * as bp from '.botpress'

export const executeAgentTyping = async ({
  conversation,
  client,
}: {
  conversation: Conversation
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onAgentTyping',
    payload: {
      conversation
    },
  })
}
