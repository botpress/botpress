import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from '../schemas'
import { botpressEventDataSchema, pickIdAndName } from './common'

const _cardCommentSchema = z.object({
  id: trelloIdSchema.title('Comment ID').describe('Unique identifier of the comment'),
  text: z.string().title('Comment Text').describe('Text of the comment'),
})

export const cardCommentCreatedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  list: pickIdAndName(listSchema).title('List').describe('List where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  comment: _cardCommentSchema.title('New Comment').describe('Comment that was added to the card'),
})

export const cardCommentUpdatedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  comment: _cardCommentSchema.title('Updated Comment').describe('Comment that was updated'),
  old: _cardCommentSchema.omit({ id: true }).title('Old Comment').describe('The previous data of the comment'),
})

export const cardCommentDeletedEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  comment: _cardCommentSchema
    .pick({ id: true })
    .title('Deleted Comment')
    .describe('Comment that was deleted from the card'),
})
