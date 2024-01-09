import { listEvents } from '../actions'
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
    ui: {}, // Placeholder value for 'ui'
  },
  output: {
    schema: createEventOutputSchema,
  },
}

const updateEvent: ActionDef = {
  title: 'Update Event',
  input: {
    schema: updateEventInputSchema,
    ui: {}, // Placeholder value for 'ui'
  },
  output: {
    schema: updateEventOutputSchema,
  },
}

const deleteEvent: ActionDef = {
  title: 'Delete Event',
  input: {
    schema: deleteEventInputSchema,
    ui: {}, // Placeholder value for 'ui'
  },
  output: {
    schema: deleteEventOutputSchema,
  },
}

const getEvents: ActionDef = {
  title: 'Get Events',
  input: {
    schema: listEventsInputSchema,
    ui: listEvents,
  },
  output: {
    schema: listEventsOutputSchema,
  },
}

export const actions = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} as ActionDefinitions
