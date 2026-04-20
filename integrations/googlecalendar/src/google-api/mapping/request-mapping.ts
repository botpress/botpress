import type { calendar_v3 } from 'googleapis'
import { randomUUID } from 'node:crypto'
import { CreateEventRequest, UpdateEventRequest } from '../types'
import { IsoToRFC3339 } from './datetime-utils/iso-to-rfc3339'

export namespace RequestMapping {
  export const mapCreateEvent = (event: CreateEventRequest): calendar_v3.Schema$Event => {
    const mappedEvent: calendar_v3.Schema$Event = {
      ...event,
      start: _mapDateTime(event.startDateTime),
      end: _mapDateTime(event.endDateTime),
    }

    if (event.enableGoogleMeet) {
      mappedEvent.conferenceData = {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      }
    }

    if (event.attendees && event.attendees.length > 0) {
      mappedEvent.attendees = event.attendees.map((attendee) => ({
        email: attendee.email,
        displayName: attendee.displayName,
        optional: attendee.optional ?? false,
      }))
    }

    return mappedEvent
  }

  export const mapUpdateEvent: (event: UpdateEventRequest) => calendar_v3.Schema$Event = mapCreateEvent

  const _mapDateTime = (dateTime: string): calendar_v3.Schema$EventDateTime => ({
    // The replaceAll is used to remove the extra quotes from the input created by the studio
    dateTime: IsoToRFC3339.convertDate(dateTime.replaceAll('"', '')),
  })
}
