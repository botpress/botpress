import { Conversation } from '@botpress/client'
import * as bp from '.botpress'

export const executeAgentNotTyping = async ({
  conversation,
  client,
}: {
  conversation: Conversation
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'onAgentNotTyping',
    payload: {
      conversation
    },
  })
}
