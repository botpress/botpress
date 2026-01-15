import { z } from '@botpress/sdk'
import { pickIdAndName, TrelloEventType } from 'definitions/events/common'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from 'definitions/schemas'
import { baseEventActionSchema } from './common'

const _basicListSchema = pickIdAndName(listSchema)
const _basicCardSchema = pickIdAndName(cardSchema)

/** The number of minutes before the due date when a reminder will be sent.
 *
 *  @remark When the value is "-1", it means no due date reminder is set. */
const _dueReminderSchema = z.number().int('Due reminder is not an integer').min(-1)

export const cardCreatedEventSchema = baseEventActionSchema.extend({
  type: z.literal(TrelloEventType.CARD_CREATED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    list: _basicListSchema,
    card: _basicCardSchema,
  }),
})

const _baseCardUpdateDataSchema = _basicCardSchema
  .extend({
    // These properties are only included if their values were modified
    desc: z.string(),
    idList: trelloIdSchema,
    idLabels: z.array(trelloIdSchema),
    pos: z.number(),
    start: z.string().datetime().nullable(),
    due: z.string().datetime().nullable(),
    dueReminder: _dueReminderSchema.nullable(),
    dueComplete: z.boolean(),
    closed: z.boolean(),
  })
  .passthrough()
  .partial()

export const cardUpdatedEventSchema = baseEventActionSchema.extend({
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

export const cardDeletedEventSchema = baseEventActionSchema.extend({
  type: z.literal(TrelloEventType.CARD_DELETED),
  data: z.object({
    board: pickIdAndName(boardSchema),
    list: _basicListSchema,
    card: _basicCardSchema.pick({ id: true }),
  }),
})

export const cardVotesUpdatedEventSchema = baseEventActionSchema.extend({
  type: z.literal(TrelloEventType.VOTE_ON_CARD),
  data: z.object({
    board: pickIdAndName(boardSchema),
    card: _basicCardSchema,
    voted: z.boolean(),
  }),
})
