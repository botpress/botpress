import { z } from '@botpress/sdk'

// documentation: https://developers.google.com/calendar/api/v3/reference/events#resource

export namespace Event {
  const _fields = {
    id: z.string().title('Event ID').describe('Opaque identifier of the event.'),
    summary: z.string().title('Summary').describe('Title of the event.'),
    description: z
      .string()
      .title('Description')
      .optional()
      .describe('Description of the event. Can contain HTML. Optional.'),
    location: z
      .string()
      .title('Location')
      .optional()
      .describe('Geographic location of the event as free-form text. Optional. (e.g., "Meeting Room").'),
    startDateTime: z
      .string()
      .title('Start Date/Time')
      .describe('The start date and time in RFC3339 format (e.g., "2023-12-31T10:00:00.000Z").'),
    endDateTime: z
      .string()
      .title('End Date/Time')
      .describe('The end date and time in RFC3339 format (e.g., "2023-12-31T12:00:00.000Z").'),
    colorId: z.string().title('Color ID').optional().describe('The color ID of the event. Optional.'),
    eventType: z
      .enum(['default', 'birthday', 'focusTime', 'fromGmail', 'outOfOffice', 'workingLocation'])
      .title('Event Type')
      .describe('Specific type of the event. This cannot be modified after the event is created.'),
    guestsCanInviteOthers: z
      .boolean()
      .title('Guests Can Invite Others')
      .optional()
      .default(true)
      .describe(
        'Whether attendees other than the organizer can invite others to the event. Optional. The default is True.'
      ),
    guestsCanSeeOtherGuests: z
      .boolean()
      .title('Guests Can See Other Guests')
      .optional()
      .default(true)
      .describe(
        "Whether attendees other than the organizer can see who the event's attendees are. Optional. The default is True."
      ),
    htmlLink: z.string().title('HTML Link').describe('URL of the event page in the Google Calendar Web UI.'),
    recurrence: z
      .array(
        z
          .string()
          .title('RFC5545 line')
          .describe(
            'RRULE, EXRULE, RDATE or EXDATE line, as specified in RFC5545. Note that DTSTART and DTEND lines are not allowed in this field'
          )
      )
      .title('Recurrence')
      .optional()
      .describe(
        'List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545. This field is omitted for single events or instances of recurring events.'
      ),
    status: z
      .enum(['confirmed', 'tentative', 'cancelled'])
      .title('Event Status')
      .optional()
      .default('confirmed')
      .describe('Status of the event. Optional. The default value is "confirmed".'),
    visibility: z
      .enum(['default', 'public', 'private', 'confidential'])
      .title('Event Visibility')
      .optional()
      .default('default')
      .describe('Visibility of the event. Optional. The default value is "default".'),
    enableGoogleMeet: z
      .boolean()
      .title('Enable Google Meet')
      .optional()
      .default(false)
      .describe('Whether to enable Google Meet for the event. Optional. The default value is false.'),
    sendNotifications: z
      .boolean()
      .title('Send Notifications')
      .optional()
      .default(true)
      .describe('Whether to send notifications to attendees. Optional. The default value is true.'),
    attendees: z
      .array(
        z.object({
          email: z.string().title('Email').describe('The email address of the attendee.'),
          displayName: z.string().title('Display Name').optional().describe('The name of the attendee. Optional.'),
          optional: z
            .boolean()
            .title('Optional Attendee')
            .optional()
            .default(false)
            .describe('Whether this is an optional attendee. Optional. The default is False.'),
          responseStatus: z
            .enum(['needsAction', 'declined', 'tentative', 'accepted'])
            .title('Response Status')
            .optional()
            .describe("The attendee's response status. Read-only when creating events."),
        })
      )
      .title('Attendees')
      .optional()
      .describe('List of attendees for the event. Email invitations will be sent automatically.'),
    conferenceLink: z
      .string()
      .title('Conference Link')
      .optional()
      .describe('The Google Meet link for the event. This is automatically generated when enableGoogleMeet is true.'),
  } as const

  export const schema = z.object(_fields)
  export type inferredType = z.infer<typeof schema>
}
