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
    attendees: event.attendees?.map((x) => ({ email: x.email ?? undefined })) ?? undefined,
    conferenceData: _mapConferenceData(event.conferenceData),
  }
}

const _mapConferenceData = (
  conferenceData: calendar_v3.Schema$ConferenceData | undefined
): bp.entities.event.Event['conferenceData'] => {
  if (!conferenceData) {
    return conferenceData
  }
  if (!conferenceData.createRequest) {
    return {}
  }
  return {
    createRequest: {
      requestId: conferenceData.createRequest.requestId ?? undefined,
    },
  }
}
