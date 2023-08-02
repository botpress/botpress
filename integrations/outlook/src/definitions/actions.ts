import z from 'zod'

import {
  sendEmailInputSchema,
  createEventInputSchema,
  createEventOutputSchema,
} from '../misc/custom-schemas'

const sendEmail = {
  title: 'Send Email',
  description: 'Send Email to specific User',
  input: {
    schema: sendEmailInputSchema,
    ui: {
      subject: {
        title: 'Email subject',
      },
      type: {
        title:
          'Email body content type (Text/HTML) (Optional. Defautl: "Text") ',
      },
      body: {
        title: 'Email body',
      },
      toRecipients: {
        title: 'Comma-separate recipient email addresses',
      },
      ccRecipients: {
        title: 'Comma-separate CC recipient email addresses (Optional)',
      },
      bccRecipients: {
        title: 'Comma-separate BCC recipient email addresses (Optional)',
      },
    },
  },
  output: {
    schema: z.object({}),
  },
}

const createEvent = {
  title: 'Create Event',
  description: 'Create an event in the user calendar',
  input: {
    schema: createEventInputSchema,
    ui: {
      subject: {
        title: 'Event subject',
      },
      content: {
        title: 'Event content (Optional)',
      },
      startDateTime: {
        title:
          'Start datetime for the event in ISO 8601 (e.g: 2017-04-15T12:00:00)',
      },
      startTimeZone: {
        title:
          'Start timezone for the event in Windows or IANA format (e.g: "Pacific Standard Time" or "America/Los_Angeles")',
      },
      endDateTime: {
        title:
          'End datetime for the event in ISO 8601 (e.g: 2017-04-15T12:00:00)',
      },
      endTimeZone: {
        title:
          'End timezone for the event in Windows or IANA format (e.g: "Pacific Standard Time" or "America/Los_Angeles")',
      },
      location: {
        title: 'Event location (e.g: In the office N° 5)',
      },
      attendeeAddress: {
        title:
          'Comma-separated list of attendee email addresses, in the same order as attendeeNames',
      },
      attendeeNames: {
        title:
          'Comma-separated list of attendee names, in the same order as attendeeEmails',
      },
    },
  },
  output: {
    schema: createEventOutputSchema,
  },
}

export const actions = {
  sendEmail,
  createEvent,
}
