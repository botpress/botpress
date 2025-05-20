import type { TriggerPayload } from 'src/triggers'
import { retrieveHitlConversation } from './hitl-ticket-filter'
import * as bp from '.botpress'

export const executeTicketSolved = async ({
  zendeskTrigger,
  client,
  ctx,
  logger,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  const conversation = await retrieveHitlConversation({
    zendeskTrigger,
    client,
    ctx,
    logger,
  })

  if (!conversation) {
    return
  }

  await client.createEvent({
    type: 'hitlStopped',
    payload: {
      conversationId: conversation.id,
    },
  })
}
