import { z } from 'zod'
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
  event: {
    title: 'Event Data',
    examples: [
      {
        summary: 'Team Meeting',
        description: 'Discuss project updates.',
        location: 'Meeting Room',
        startDateTime: '2023-12-31T10:00:00Z',
        endDateTime: '2023-12-31T12:00:00Z',
      },
    ],
  },
} satisfies UiOf<typeof schemas.createEventInputSchema>

export const updateEventUi = {
  eventId: {
    title: 'Event ID',
    examples: ['12345'],
  },
  event: {
    title: 'Updated Event Data',
    examples: [
      {
        summary: 'Updated Team Meeting',
        description: 'Discuss project updates (updated).',
        location: 'Meeting Room (updated)',
        startDateTime: '2023-12-31T11:00:00Z',
        endDateTime: '2023-12-31T13:00:00Z',
      },
    ],
  },
} satisfies UiOf<typeof schemas.updateEventInputSchema>

export const deleteEventUi = {
  eventId: {
    title: 'Event ID',
    examples: ['12345'],
  },
} satisfies UiOf<typeof schemas.deleteEventInputSchema>

export const listEventsUi = {
  startDate: {
    title: 'Start Date',
    examples: ['2023-12-31T00:00:00Z'],
  },
  endDate: {
    title: 'End Date',
    examples: ['2024-01-01T00:00:00Z'],
  },
} satisfies UiOf<typeof schemas.listEventsInputSchema>
