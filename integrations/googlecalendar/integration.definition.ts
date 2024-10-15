import { z, IntegrationDefinition } from '@botpress/sdk'
import creatable from './bp_modules/creatable'
import deletable from './bp_modules/deletable'
import listable from './bp_modules/listable'
import readable from './bp_modules/readable'
import updatable from './bp_modules/updatable'
import { INTEGRATION_NAME } from './src/const'
import {
  listEventsInputSchema,
  listEventsOutputSchema,
  createEventInputSchema,
  createEventOutputSchema,
  updateEventInputSchema,
  updateEventOutputSchema,
  deleteEventInputSchema,
  deleteEventOutputSchema,
} from './src/misc/custom-schemas'
import { updateEventUi, deleteEventUi, createEventUi } from './src/misc/custom-uis'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.4.2',
  description:
    "Elevate your chatbot's capabilities with the Botpress integration for Google Calendar. Seamlessly sync your chatbot with Google Calendar to effortlessly manage events, appointments, and schedules",
  title: 'Google Calendar',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      calendarId: z
        .string()
        .min(1)
        .describe('The ID of the Google Calendar to interact with. You can find it in your Google Calendar settings.'),
      privateKey: z
        .string()
        .min(1)
        .describe('The private key from the Google service account. You can get it from the downloaded JSON file.'),
      clientEmail: z
        .string()
        .email()
        .describe('The client email from the Google service account. You can get it from the downloaded JSON file.'),
    }),
  },
  entities: {
    event: {
      schema: z.object({
        id: z.string().describe('The ID of the calendar event.'),
        summary: z.string().optional().describe('The event title/summary.'),
        description: z.string().optional().describe('The event description.'),
        location: z.string().optional().describe('The event location.'),
        startDateTime: z
          .string()
          .optional()
          .describe('The start date and time in RFC3339 format (e.g., "2023-12-31T10:00:00.000Z").'),
        endDateTime: z
          .string()
          .optional()
          .describe('The end date and time in RFC3339 format (e.g., "2023-12-31T12:00:00.000Z").'),
      }),
      ui: {},
    },
  },
  actions: {
    listEvents: {
      title: 'List Events',
      input: {
        schema: listEventsInputSchema,
        ui: {},
      },
      output: {
        schema: listEventsOutputSchema,
      },
    },
    createEvent: {
      title: 'Create Event',
      input: {
        schema: createEventInputSchema,
        ui: createEventUi,
      },
      output: {
        schema: createEventOutputSchema,
      },
    },
    updateEvent: {
      title: 'Update Event',
      input: {
        schema: updateEventInputSchema,
        ui: updateEventUi,
      },
      output: {
        schema: updateEventOutputSchema,
      },
    },
    deleteEvent: {
      title: 'Delete Event',
      input: {
        schema: deleteEventInputSchema,
        ui: deleteEventUi,
      },
      output: {
        schema: deleteEventOutputSchema,
      },
    },
  },
})
  .extend(listable, (entities) => ({
    item: entities.event,
  }))
  .extend(creatable, (entities) => ({
    item: entities.event,
  }))
  .extend(readable, (entities) => ({
    item: entities.event,
  }))
  .extend(updatable, (entities) => ({
    item: entities.event,
  }))
  .extend(deletable, (entities) => ({
    item: entities.event,
  }))
