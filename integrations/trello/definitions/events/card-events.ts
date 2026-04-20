import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from '../schemas'
import { botpressEventDataSchema, dueReminderSchema, pickIdAndName } from './common'

export const cardCreatedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was created'),
  list: pickIdAndName(listSchema).title('List').describe('List where the card was created'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was created'),
})

const _baseCardUpdateDataSchema = z
  .object({
    id: trelloIdSchema.title('Card ID').describe('Unique identifier of the card'),
    name: z.string().title('Card Name').describe('Name of the card'),
    description: z.string().title('Card Description').describe('Description of the card'),
    listId: trelloIdSchema.title('List ID').describe('Unique identifier of the list where the card is located'),
    labelIds: z.array(trelloIdSchema).title('Label IDs').describe('Labels attached to the card'),
    verticalPosition: z.number().title('Card Position').describe('Position of the card within the list'),
    startDate: z.string().datetime().nullable().title('Start Date').describe('Start date of the card'),
    dueDate: z.string().datetime().nullable().title('Due Date').describe('Due date of the card'),
    dueDateReminder: dueReminderSchema,
    isCompleted: z.boolean().title('Is Completed').describe('Whether the card is completed'),
    isArchived: z.boolean().title('Is Archived').describe('Whether the card is archived'),
  })
  .passthrough()
  .partial()

export const cardUpdatedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: _baseCardUpdateDataSchema.required({ id: true, name: true }).title('Card').describe('Card that was updated'),
  old: _baseCardUpdateDataSchema.omit({ id: true }).title('Old').describe('Previous state of the card'),
  // Only excluded/optional when the card is moved between lists
  list: pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
  // Only included if the card was moved between lists
  listBefore: pickIdAndName(listSchema)
    .optional()
    .title('List Before')
    .describe('Previous list where the card was located'),
  // Only included if the card was moved between lists
  listAfter: pickIdAndName(listSchema)
    .optional()
    .title('List After')
    .describe('New list where the card is now located'),
})

export const cardDeletedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was deleted'),
  list: pickIdAndName(listSchema).title('List').describe('List where the card was deleted'),
  card: cardSchema.pick({ id: true }).title('Card').describe('Card that was deleted'),
})

export const cardVotesUpdatedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  voted: z.boolean().title('Has Voted').describe('Whether the user voted on the card'),
})
