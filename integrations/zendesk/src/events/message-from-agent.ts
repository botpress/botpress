import type { Client } from '@botpress/client'
import type { TriggerPayload } from 'src/misc/types'

export const executeMessageFromAgent = async ({
  zendeskTrigger,
  client,
}: {
  zendeskTrigger: TriggerPayload
  client: Client
}) => {
  // TODO: Bind this to a conversation somehow (using ticketId)
  console.log('Executing message from agent', zendeskTrigger)

  const state = await client.getState({
    name: 'ticketBinding',
    id: zendeskTrigger.ticketId,
    type: 'conversation',
  })

  console.log('state:', state)

  await client.createEvent({
    type: 'messageFromAgent',
    payload: {
      type: zendeskTrigger.type,
      ticketId: zendeskTrigger.ticketId,
      agent: zendeskTrigger.agent,
      comment: zendeskTrigger.comment,
    },
  })
}
