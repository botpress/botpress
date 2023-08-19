import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'

export const executeTicketAssigned = async ({
  zendeskTrigger,
  client,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'ticketAssigned',
    payload: {
      type: zendeskTrigger.type,
      ticketId: zendeskTrigger.ticketId,
      comment: zendeskTrigger.comment,
      agentName: zendeskTrigger.agent,
    },
  })
}
