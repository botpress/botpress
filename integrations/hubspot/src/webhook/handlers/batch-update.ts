import * as sdk from '@botpress/sdk'
import { getAccessToken } from '../../auth'
import { HubspotClient } from '../../hubspot-api'
import {
  BATCH_UPDATE_EVENT_PAYLOAD,
  isCompanyCreatedEvent,
  isCompanyDeletedEvent,
  isContactCreatedEvent,
  isContactDeletedEvent,
  isLeadCreatedEvent,
  isLeadDeletedEvent,
  isTicketCreatedEvent,
  isTicketDeletedEvent,
} from '../event-payloads'
import * as bp from '.botpress'

export const isBatchUpdateEvent = (props: bp.HandlerProps): boolean =>
  Boolean(
    props.req.method.toUpperCase() === 'POST' &&
      props.req.body?.length &&
      BATCH_UPDATE_EVENT_PAYLOAD.safeParse(JSON.parse(props.req.body)).success
  )

export const handleBatchUpdateEvent: bp.IntegrationProps['handler'] = async (props) => {
  const hsClient = new HubspotClient({ accessToken: await getAccessToken(props), ...props })
  const events: sdk.z.infer<typeof BATCH_UPDATE_EVENT_PAYLOAD> = JSON.parse(props.req.body!)

  for (const event of events) {
    switch (true) {
      case isContactCreatedEvent(event):
        const contact = await hsClient.getContactById({ contactId: event.objectId })
        props.client.createEvent({
          type: 'contactCreated',
          payload: {
            contactId: event.objectId.toString(),
            email: contact?.properties.email ?? undefined,
            phoneNumber: contact?.properties.phone ?? undefined,
            name: `${contact?.properties.firstname} ${contact?.properties.lastname}`.trim() || undefined,
          },
        })
        break
      case isContactDeletedEvent(event):
        props.client.createEvent({
          type: 'contactDeleted',
          payload: {
            contactId: event.objectId.toString(),
          },
        })
        break
      case isCompanyCreatedEvent(event):
        const company = await hsClient.getCompanyById({ companyId: event.objectId })
        props.client.createEvent({
          type: 'companyCreated',
          payload: {
            companyId: event.objectId.toString(),
            domain: company?.properties.domain ?? undefined,
            phoneNumber: company?.properties.phone ?? undefined,
            name: company?.properties.name ?? undefined,
          },
        })
        break
      case isCompanyDeletedEvent(event):
        props.client.createEvent({
          type: 'companyDeleted',
          payload: {
            companyId: event.objectId.toString(),
          },
        })
        break
      case isTicketCreatedEvent(event):
        const ticket = await hsClient.getTicketById({ ticketId: event.objectId })
        props.client.createEvent({
          type: 'ticketCreated',
          payload: {
            ticketId: event.objectId.toString(),
            subject: ticket?.properties.subject ?? undefined,
            priority: ticket?.properties.hs_ticket_priority ?? undefined,
            category: ticket?.properties.hs_ticket_category ?? undefined,
            pipeline: ticket?.pipeline.label,
            stage: ticket?.pipelineStage.label,
          },
        })
        break
      case isTicketDeletedEvent(event):
        props.client.createEvent({
          type: 'ticketDeleted',
          payload: {
            ticketId: event.objectId.toString(),
          },
        })
        break
      case isLeadCreatedEvent(event):
        break
      case isLeadDeletedEvent(event):
        break
      default:
        event satisfies never
    }
  }
}
