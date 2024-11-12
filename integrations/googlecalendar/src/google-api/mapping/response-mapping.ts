import type { calendar_v3 } from 'googleapis'
import { Event } from '../types'

export namespace ResponseMapping {
  export const mapEvent = (event: calendar_v3.Schema$Event): Event => ({
    id: event.id ?? '',
    description: event.description ?? '',
    summary: event.summary ?? '',
    location: event.location ?? '',
    startDateTime: event.start?.dateTime ?? '',
    endDateTime: event.end?.dateTime ?? '',
    eventType: _mapEventType(event.eventType),
    guestsCanInviteOthers: event.guestsCanInviteOthers ?? true,
    guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests ?? true,
    htmlLink: event.htmlLink ?? '',
    recurrence: event.recurrence ?? [],
    status: _mapEventStatus(event.status),
    colorId: event.colorId ?? '',
    visibility: _mapEventVisibility(event.visibility),
  })

  export const mapEvents = (events?: calendar_v3.Schema$Event[]): Event[] => events?.map(mapEvent) ?? []

  const _mapEventType = (eventType: calendar_v3.Schema$Event['eventType']): Event['eventType'] =>
    _mapEnum({
      value: eventType,
      mapping: {
        default: 'default',
        birthday: 'birthday',
        focusTime: 'focusTime',
        fromGmail: 'fromGmail',
        outOfOffice: 'outOfOffice',
        workingLocation: 'workingLocation',
      },
      defaultValue: 'default',
    })

  const _mapEventStatus = (status: calendar_v3.Schema$Event['status']): Event['status'] =>
    _mapEnum({
      value: status,
      mapping: {
        confirmed: 'confirmed',
        tentative: 'tentative',
        cancelled: 'cancelled',
      },
      defaultValue: 'confirmed',
    })

  const _mapEventVisibility = (visibility: calendar_v3.Schema$Event['visibility']): Event['visibility'] =>
    _mapEnum({
      value: visibility,
      mapping: {
        default: 'default',
        confidential: 'confidential',
        private: 'private',
        public: 'public',
      },
      defaultValue: 'default',
    })

  export const mapNextToken = (nextPageToken?: string | null) => nextPageToken ?? undefined
}

const _mapEnum = <TInput extends string | null | undefined, TOutput extends string>({
  value,
  mapping,
  defaultValue,
}: {
  value: TInput
  mapping: Record<string, TOutput>
  defaultValue: TOutput
}): TOutput => mapping[value ?? ''] ?? defaultValue
