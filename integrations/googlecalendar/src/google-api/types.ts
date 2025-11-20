import { Event as EventEntity } from 'definitions'
import { google } from 'googleapis'

export type GoogleCalendarClient = ReturnType<typeof google.calendar>
export type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>

// Entities:
export type Event = EventEntity.inferredType
type BareMinimumEvent = PartialExcept<Event, 'startDateTime' | 'endDateTime'>

// Action requests:
export type CreateEventRequest = Omit<BareMinimumEvent, 'id' | 'eventType' | 'htmlLink' | 'attendees'> & {
  attendees?: Array<{
    email: string
    displayName?: string
    optional?: boolean
    responseStatus?: 'tentative' | 'needsAction' | 'declined' | 'accepted'
  }>
}
export type UpdateEventRequest = Omit<BareMinimumEvent, 'eventType' | 'htmlLink' | 'attendees'> & {
  attendees?: Array<{
    email: string
    displayName?: string
    optional?: boolean
    responseStatus?: 'tentative' | 'needsAction' | 'declined' | 'accepted'
  }>
}

// Type utilities:

/** Like Pick<T,K>, but each property is required */
type PickRequired<T, K extends keyof T> = { [P in K]-?: T[P] }
/** Makes all properties of T optional, except K, which are all required */
type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & PickRequired<T, K>
