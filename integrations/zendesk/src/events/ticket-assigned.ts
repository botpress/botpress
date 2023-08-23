import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'

export const executeTicketAssigned = async ({
  zendeskTrigger,
  client,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
}) => {
  console.info('ticketAssigned', {
    type: zendeskTrigger.type,
    tickeId: zendeskTrigger.ticketId,
    status: zendeskTrigger.status,
    comment: zendeskTrigger.comment,
    agent: zendeskTrigger.agent,
  })
  await client.createEvent({
    type: 'ticketAssigned',
    payload: {
      type: zendeskTrigger.type,
      tickeId: zendeskTrigger.ticketId,
      status: zendeskTrigger.status,
      comment: zendeskTrigger.comment,
      agent: zendeskTrigger.agent,
    },
  })
}
