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
        title: 'Email body content type',
      },
      body: {
        title: 'Email body',
      },
      to: {
        title: 'Recipient email addresses',
      },
      ccRecipients: {
        title: 'CC recipient email addresses',
      },
    },
  },
  output: {
    schema: z.object({
      id: z.string(),
    }),
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
      body: {
        title: 'Event body',
      },
      start: {
        title: 'Event start time',
      },
      end: {
        title: 'Event end time',
      },
      location: {
        title: 'Event location',
      },
      attendees: {
        title: 'Event attendees',
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
