import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, trelloIdSchema } from '../schemas'
import { botpressEventDataSchema, pickIdAndName } from './common'

export const eventMemberSchema = z.object({
  id: trelloIdSchema.title('Member ID').describe('Unique identifier of the member'),
  name: z.string().title('Member Name').describe('Full name of the member'),
})

export const memberAddedToCardEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that the member was added to'),
  member: eventMemberSchema.title('Member').describe('Member that was added to the card'),
})

export const memberRemovedFromCardEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  member: eventMemberSchema
    .extend({
      deactivated: z
        .boolean()
        .title('Deactivated')
        .describe('Indicates if the member was deactivated at the time of removal'),
    })
    .title('Member')
    .describe('Member that was removed from the card'),
})
