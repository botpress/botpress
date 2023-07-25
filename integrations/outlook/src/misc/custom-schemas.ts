import * as z from 'zod'

const emailAddress = z.string().min(1, 'Email address cannot be blank')
const emailOrNameEmail = z.union([
  emailAddress,
  z.object({
    emailAddress: z.object({ address: emailAddress }),
    name: z.string().optional(),
  }),
])
const textOrHtmlSchema = z.union([z.literal('Text'), z.literal('HTML')])

export const htmlSchema = z.object({ content: z.string() })

export const notificationContentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'email content must be defined'),
    contentType: z.string(),
  }),
  sender: emailOrNameEmail,
  from: emailOrNameEmail,
  toRecipients: z.array(emailOrNameEmail),
  ccRecipients: z.array(emailOrNameEmail),
  conversationId: z.string(),
  subject: z.string(),
  id: z.string(),
})

export const sendEmailInputSchema = z.object({
  subject: z.string().describe('The subject of the email'),
  type: textOrHtmlSchema
    .optional()
    .describe(
      'The content type of the email body, can be either "Text" or "HTML"'
    ),
  body: z.string().describe('The body of the email'),
  toRecipients: z
    .union([z.string(), z.array(z.string())])
    .describe(
      'The recipients of the email (Can be either a string with comma-separated emails)'
    ),
  ccRecipients: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe(
      'The CC recipients of the email (Can be either a string with comma-separated emails)'
    ),
})

const bodySchema = z.object({
  contentType: z.string().describe('Content type for the event body'),
  content: z.string().describe('Content for the event body'),
})

const dateTimeTimeZoneSchema = z.object({
  dateTime: z.string().describe('Date and time'),
  timeZone: z.string().describe('Time zone'),
})

const locationSchema = z.object({
  displayName: z.string().describe('Display name for the event location'),
})

const attendeeSchema = z.object({
  emailAddress: z.object({
    address: z.string().describe('Email address of the attendee'),
    name: z.string().describe('Name of the attendee'),
  }),
  type: z.string().describe('Type of attendee (required or optional)'),
})

export const createEventPropsSchema = z.object({
  subject: z.string().describe('Subject for the event'),
  body: bodySchema,
  start: dateTimeTimeZoneSchema.describe('Start time for the event'),
  end: dateTimeTimeZoneSchema.describe('End time for the event'),
  location: locationSchema,
  attendees: z
    .array(attendeeSchema)
    .describe('Array of attendees for the event'),
})

export const createEventInputSchema = z.object({
  subject: z.string().describe('Subject for the event'),
  content: z.string().describe('Content for the event'),
  startDateTime: z.string().describe('Start datetime for the event'),
  startTimeZone: z.string().describe('Start timezone for the event'),
  endDateTime: z.string().describe('End datetime for the event'),
  endTimeZone: z.string().describe('End timezone for the event'),
  location: z.string().describe('Name for the event location'),
  attendeeAddress: z
    .string()
    .describe(
      'Comma-separated list of attendee email addresses, in the same order as attendeeNames'
    ),
  attendeeNames: z
    .string()
    .describe(
      'Comma-separated list of attendee names, in the same order as attendeeEmails'
    ),
})

export const createEventOutputSchema = z.object({
  '@odata.context': z.string(),
  '@odata.etag': z.string(),
  id: z.string(),
  createdDateTime: z.string(),
  lastModifiedDateTime: z.string(),
  changeKey: z.string(),
  categories: z.array(z.string()),
  originalStartTimeZone: z.string(),
  originalEndTimeZone: z.string(),
  iCalUId: z.string(),
  reminderMinutesBeforeStart: z.number(),
  isReminderOn: z.boolean(),
  hasAttachments: z.boolean(),
  hideAttendees: z.boolean(),
  subject: z.string(),
  bodyPreview: z.string(),
  importance: z.string(),
  sensitivity: z.string(),
  isAllDay: z.boolean(),
  isCancelled: z.boolean(),
  isDraft: z.boolean(),
  isOrganizer: z.boolean(),
  responseRequested: z.boolean(),
  seriesMasterId: z.null().or(z.string()),
  transactionId: z.string(),
  showAs: z.string(),
  type: z.string(),
  webLink: z.string(),
  onlineMeetingUrl: z.null().or(z.string()),
  isOnlineMeeting: z.boolean(),
  onlineMeetingProvider: z.string(),
  onlineMeeting: z.null().or(z.string()),
  allowNewTimeProposals: z.boolean(),
  responseStatus: z.object({
    response: z.string(),
    time: z.string(),
  }),
  body: z.object({
    contentType: z.string(),
    content: z.string(),
  }),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.string(),
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.string(),
  }),
  location: z.object({
    displayName: z.string(),
    locationType: z.string(),
    uniqueId: z.string(),
    uniqueIdType: z.string(),
  }),
  locations: z.array(
    z.object({
      displayName: z.string(),
      locationType: z.string(),
      uniqueIdType: z.string(),
    })
  ),
  recurrence: z.null().or(z.string()),
  attendees: z.array(
    z.object({
      type: z.string(),
      status: z.object({
        response: z.string(),
        time: z.string(),
      }),
      emailAddress: z.object({
        name: z.string(),
        address: z.string(),
      }),
    })
  ),
  organizer: z.object({
    emailAddress: z.object({
      name: z.string(),
      address: z.string(),
    }),
  }),
})
