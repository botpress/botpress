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
        break
      case isCompanyDeletedEvent(event):
        break
      case isTicketCreatedEvent(event):
        break
      case isTicketDeletedEvent(event):
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
