import * as sdk from '@botpress/sdk'
import { calendar_v3 } from 'googleapis'
import * as bp from '.botpress'

export const mapEvent = (event: calendar_v3.Schema$Event): bp.entities.event.Event => {
  if (!event.id) {
    // I don't see why this would happen, but these are the google calendar API typings
    throw new sdk.RuntimeError('Event ID is missing')
  }

  return {
    id: event.id,
    summary: event.summary ?? undefined,
    location: event.location ?? undefined,
    description: event.description ?? undefined,
    endDateTime: event.end?.dateTime ?? undefined,
    startDateTime: event.start?.dateTime ?? undefined,
  }
}
