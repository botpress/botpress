import { google } from 'googleapis'
import { Event as EventEntity } from 'definitions'

type GoogleCalendarClient = ReturnType<typeof google.calendar>
type GoogleOAuth2Client = InstanceType<(typeof google.auth)['OAuth2']>

// Entities:
type Event = EventEntity.inferredType
type BareMinimumEvent = PartialExcept<Event, 'startDateTime' | 'endDateTime'>

// Action requests:
type CreateEventRequest = Omit<BareMinimumEvent, 'id' | 'eventType' | 'htmlLink'>
type UpdateEventRequest = Omit<BareMinimumEvent, 'eventType' | 'htmlLink'>

// Type utilities:

/** Like Pick<T,K>, but each property is required */
type PickRequired<T, K extends keyof T> = { [P in K]-?: T[P] }
/** Makes all properties of T optional, except K, which are all required */
type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & PickRequired<T, K>
