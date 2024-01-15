import {
  ActionDefinitions,
  listEventsInputSchema,
  listEventsOutputSchema,
  createEventInputSchema,
  createEventOutputSchema,
  updateEventInputSchema,
  updateEventOutputSchema,
  deleteEventInputSchema,
  deleteEventOutputSchema,
} from '../misc/custom-schemas'
import { updateEventUi, deleteEventUi, createEventUi } from '../misc/custom-uis'

type ActionDef = {
  title: string
  input: {
    schema: any
    ui: any
  }
  output: {
    schema: any
  }
}

const createEvent: ActionDef = {
  title: 'Create Event',
  input: {
    schema: createEventInputSchema,
    ui: createEventUi,
  },
  output: {
    schema: createEventOutputSchema,
  },
}

const updateEvent: ActionDef = {
  title: 'Update Event',
  input: {
    schema: updateEventInputSchema,
    ui: updateEventUi,
  },
  output: {
    schema: updateEventOutputSchema,
  },
}

const deleteEvent: ActionDef = {
  title: 'Delete Event',
  input: {
    schema: deleteEventInputSchema,
    ui: deleteEventUi,
  },
  output: {
    schema: deleteEventOutputSchema,
  },
}

const listEvents: ActionDef = {
  title: 'List Events',
  input: {
    schema: listEventsInputSchema,
    ui: {},
  },
  output: {
    schema: listEventsOutputSchema,
  },
}

export const actions = {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} as ActionDefinitions
