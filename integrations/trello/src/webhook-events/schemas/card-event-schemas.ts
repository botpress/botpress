import { z } from '@botpress/sdk'
import { dueReminderSchema } from 'definitions/events/card-events'
import { pickIdAndName, TrelloEventType } from 'definitions/events/common'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from 'definitions/schemas'
import { trelloEventActionSchema } from './common'

const _basicListSchema = pickIdAndName(listSchema)
const _basicCardSchema = pickIdAndName(cardSchema)

export const cardCreatedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CARD_CREATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    list: _basicListSchema,
    card: _basicCardSchema,
  }),
})
export type CardCreatedEventAction = z.infer<typeof cardCreatedEventActionSchema>

const _baseCardUpdateDataSchema = _basicCardSchema
  .extend({
    // These properties are only included if their values were modified
    desc: z.string(),
    idList: trelloIdSchema,
    idLabels: z.array(trelloIdSchema),
    pos: z.number(),
    start: z.string().datetime().nullable(),
    due: z.string().datetime().nullable(),
    dueReminder: dueReminderSchema.nullable(),
    dueComplete: z.boolean(),
    closed: z.boolean(),
  })
  .passthrough()
  .partial()

export const cardUpdatedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CARD_UPDATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    // Seemed to only be excluded/optional when the card is moved between lists
    list: _basicListSchema.optional(),
    card: _baseCardUpdateDataSchema.required({ id: true, name: true }),
    old: _baseCardUpdateDataSchema.omit({ id: true }),
    // Only included if the card was moved between lists
    listBefore: _basicListSchema.optional(),
    // Only included if the card was moved between lists
    listAfter: _basicListSchema.optional(),
  }),
})
export type CardUpdatedEventAction = z.infer<typeof cardUpdatedEventActionSchema>

export const cardDeletedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.CARD_DELETED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    list: _basicListSchema,
    card: _basicCardSchema.pick({ id: true }),
  }),
})
export type CardDeletedEventAction = z.infer<typeof cardDeletedEventActionSchema>

export const cardVotesUpdatedEventActionSchema = trelloEventActionSchema.extend({
  type: z.literal(TrelloEventType.VOTE_ON_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: _basicCardSchema,
    voted: z.boolean(),
  }),
})
export type CardVotesUpdatedEventAction = z.infer<typeof cardVotesUpdatedEventActionSchema>
