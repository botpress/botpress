import { z } from '@botpress/sdk'
import { safeParseJson } from 'src/utils'
import { CalendlyClient } from '../calendly-api'
import type { InviteeEvent } from './schemas'
import type * as bp from '.botpress'

const trackingParameterSchema = z.union([z.string(), z.array(z.string())])

const _parseTrackingParameter = (trackingParameter: string | null): string[] => {
  if (trackingParameter === null) return []

  const parseResult = safeParseJson(trackingParameter)

  if (!parseResult.success) {
    return [trackingParameter]
  }

  const zodResult = trackingParameterSchema.safeParse(parseResult.data)
  if (!zodResult.success) {
    return [String(parseResult.data)]
  }

  const { data } = zodResult
  return Array.isArray(data) ? data : [data]
}

export const handleInviteeEvent = async (
  props: bp.HandlerProps,
  eventType: keyof bp.events.Events,
  event: InviteeEvent
) => {
  const { start_time, end_time, location, name: eventName, uri: scheduledEventUri } = event.payload.scheduled_event

  const calendlyClient = await CalendlyClient.create(props)
  const currentUser = await calendlyClient.getCurrentUser()

  const { tracking } = event.payload
  const utmContentValues = _parseTrackingParameter(tracking.utm_content)

  if (utmContentValues.length === 0) {
    props.logger.forBot().warn('The event did not have an associated utm_content value with a conversation id')
  }

  const conversationIdPattern = /conversationId=([\w]+)/
  const conversationId =
    utmContentValues
      .find((contentValue) => conversationIdPattern.test(contentValue))
      ?.match(conversationIdPattern)?.[1] ?? null

  if (!conversationId) {
    props.logger.forBot().warn('Could not extract the conversation id from the utm_content parameter')
  }

  return await props.client.createEvent({
    type: eventType,
    payload: {
      scheduledEventUri,
      eventName: eventName ?? `Meeting between ${currentUser.resource.name} and ${event.payload.name}`,
      startTime: start_time.toISOString(),
      endTime: end_time.toISOString(),
      locationType: location.type,
      organizerName: currentUser.resource.name,
      organizerEmail: currentUser.resource.email,
      inviteeName: event.payload.name,
      inviteeEmail: event.payload.email,
      conversationId,
    },
  })
}
