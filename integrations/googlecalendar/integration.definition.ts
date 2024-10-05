import { z, IntegrationDefinition, interfaces, InterfacePackage } from '@botpress/sdk'
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

const listablePkg = {
  type: 'interface',
  definition: interfaces.listable,
} satisfies InterfacePackage

const creatablePkg = {
  type: 'interface',
  definition: interfaces.creatable,
} satisfies InterfacePackage

const readablePkg = {
  type: 'interface',
  definition: interfaces.readable,
} satisfies InterfacePackage

const updatablePkg = {
  type: 'interface',
  definition: interfaces.updatable,
} satisfies InterfacePackage

const deletablePkg = {
  type: 'interface',
  definition: interfaces.deletable,
} satisfies InterfacePackage

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.4.1',
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
  .extend(listablePkg, (entities) => ({
    item: entities.event,
  }))
  .extend(creatablePkg, (entities) => ({
    item: entities.event,
  }))
  .extend(readablePkg, (entities) => ({
    item: entities.event,
  }))
  .extend(updatablePkg, (entities) => ({
    item: entities.event,
  }))
  .extend(deletablePkg, (entities) => ({
    item: entities.event,
  }))
