import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'

export const executeTicketSolved = async ({
  zendeskTrigger,
  client,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
}) => {
  console.info('ticketSolved', {
    type: zendeskTrigger.type,
    tickeId: zendeskTrigger.ticketId,
    status: zendeskTrigger.status,
    comment: zendeskTrigger.comment,
  })
  await client.createEvent({
    type: 'ticketSolved',
    payload: {
      type: zendeskTrigger.type,
      tickeId: zendeskTrigger.ticketId,
      status: zendeskTrigger.status,
      comment: zendeskTrigger.comment,
    },
  })
}
