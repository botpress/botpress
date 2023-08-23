import type { TriggerPayload } from 'src/triggers'
import * as bp from '.botpress'

export const executeTicketSolved = async ({
  zendeskTrigger,
  client,
}: {
  zendeskTrigger: TriggerPayload
  client: bp.Client
}) => {
  await client.createEvent({
    type: 'ticketSolved',
    payload: {
      type: zendeskTrigger.type,
      ticketId: zendeskTrigger.ticketId,
      status: zendeskTrigger.status,
      comment: zendeskTrigger.comment,
    },
  })
}
