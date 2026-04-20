import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, trelloIdSchema } from '../schemas'
import { botpressEventDataSchema, dueReminderSchema, pickIdAndName } from './common'

export const checklistSchema = z.object({
  id: trelloIdSchema.title('Checklist ID').describe('Unique identifier of the checklist'),
  name: z.string().title('Checklist Name').describe('Name of the checklist'),
})

const _basicChecklistItemSchema = z.object({
  id: trelloIdSchema.title('Checklist Item ID').describe('Unique identifier of the checklist item'),
  name: z.string().title('Checklist Item Name').describe('Name of the checklist item'),
  isCompleted: z.boolean().title('Is Completed').describe('Indicates if the checklist item is marked as completed'),
  textData: z
    .object({
      emoji: z.object({}).title('Checklist Item Emoji').describe('Emoji of the checklist item'),
    })
    .title('Text data')
    .describe('Text data of the checklist item'),
})

export const checklistAddedToCardEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  checklist: checklistSchema.title('Checklist').describe('Checklist that was added to the card'),
})

export const checklistItemCreatedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  checklist: checklistSchema.title('Checklist').describe('Checklist where the item was added'),
  checklistItem: _basicChecklistItemSchema.title('Checklist Item').describe('The checklist item that was added'),
})

const _baseChecklistItemUpdateDataSchema = _basicChecklistItemSchema.extend({
  dueDateReminder: dueReminderSchema.optional(),
  dueDate: z.string().datetime().nullable().optional().title('Due Date').describe('Due date of the checklist item'),
})

export const checklistItemUpdatedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  checklist: checklistSchema.title('Checklist').describe('Checklist where the item was updated'),
  checklistItem: _baseChecklistItemUpdateDataSchema.title('Checklist Item').describe('Checklist item that was updated'),
  old: _baseChecklistItemUpdateDataSchema
    .omit({ id: true })
    .partial()
    .title('Old Checklist Item')
    .describe('The previous data of the checklist item'),
})

export const checklistItemStatusUpdatedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  checklist: checklistSchema.title('Checklist').describe('Checklist where the item was updated'),
  checklistItem: _basicChecklistItemSchema.title('Checklist Item').describe('Checklist item that was updated'),
})

export const checklistItemDeletedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  checklist: checklistSchema.title('Checklist').describe('Checklist where the item was removed'),
  checklistItem: _basicChecklistItemSchema.title('Checklist Item').describe('Checklist item that was removed'),
})
