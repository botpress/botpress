import { RuntimeError } from '@botpress/sdk'
import { CalendlyClient } from '../calendly-api'
import { parseError } from '../utils'
import type * as bp from '.botpress'

export const scheduleEvent: bp.IntegrationProps['actions']['scheduleEvent'] = async (props) => {
  const { ctx, input } = props

  try {
    const calendlyClient = new CalendlyClient(ctx.configuration.accessToken)

    const currentUser = await calendlyClient.getCurrentUser()
    const eventTypes = await calendlyClient.getEventTypesList(currentUser.resource.uri)
    const eventType = eventTypes.collection.find((eventType) => eventType.scheduling_url === input.eventTypeUrl)

    if (!eventType) {
      throw new RuntimeError('Event type not found')
    }

    const resp = (await calendlyClient.createSingleUseSchedulingLink(eventType)).resource

    const searchParams = new URLSearchParams({
      utm_source: 'chatbot',
      utm_medium: 'conversation',
      utm_content: `id=${input.conversationId}`,
    })

    return {
      bookingUrl: `${resp.booking_url}?${searchParams}`,
      ownerType: resp.owner_type,
      owner: resp.owner,
    }
  } catch (thrown: unknown) {
    throw parseError(thrown)
  }
}
