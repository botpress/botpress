import { z } from '@botpress/sdk'
import * as schemas from './custom-schemas'

type SchemaOptions<T> = {
  title: string
  examples: T[]
}

type IsEmptyObject<T> = keyof T extends never ? true : false

type UiOf<TSchema extends z.AnyZodObject> = IsEmptyObject<z.infer<TSchema>> extends true
  ? Record<string, never>
  : {
      [K in keyof z.infer<TSchema>]: Partial<SchemaOptions<z.infer<TSchema>[K]>>
    }

export const createEventUi = {
  startDateTime: {
    title: 'Start Date/Time',
    examples: ['2023-12-31T11:00:00Z'],
  },
  endDateTime: {
    title: 'End Date/Time',
    examples: ['2023-12-31T13:00:00Z'],
  },
  summary: {
    title: 'Summary',
    examples: ['Team Meeting'],
  },
  description: {
    title: 'Description',
    examples: ['Discuss project updates.'],
  },
  location: {
    title: 'Location',
    examples: ['Meeting Room'],
  },
} satisfies UiOf<typeof schemas.createEventInputSchema>

export const updateEventUi = {
  eventId: {
    title: 'Event ID',
    examples: ['12345'],
  },
  endDateTime: {
    title: 'End Date/Time',
    examples: ['2023-12-31T13:00:00Z'],
  },
  location: {
    title: 'Location',
    examples: ['Meeting Room (updated)'],
  },
  startDateTime: {
    title: 'Start Date/Time',
    examples: ['2023-12-31T11:00:00Z'],
  },
  description: {
    title: 'Description',
    examples: ['Discuss project updates (updated).'],
  },
  summary: {
    title: 'Summary',
    examples: ['Updated Team Meeting'],
  },
} satisfies UiOf<typeof schemas.updateEventInputSchema>

export const deleteEventUi = {
  eventId: {
    title: 'Event ID',
    examples: ['12345'],
  },
} satisfies UiOf<typeof schemas.deleteEventInputSchema>

export const listEventsUi = {
  count: {
    title: 'Number of events to retrieve',
  },
} satisfies UiOf<typeof schemas.listEventsInputSchema>
