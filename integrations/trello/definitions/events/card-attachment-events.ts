import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from '../schemas'
import { botpressEventDataSchema, pickIdAndName } from './common'

export const attachmentAddedToCardEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  list: pickIdAndName(listSchema).title('List').describe('List where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  attachment: z
    .object({
      id: trelloIdSchema.title('Attachment ID').describe('Unique identifier of the attachment'),
      name: z.string().title('Attachment Name').describe('Name of the attachment'),
      url: z.string().url().title('Attachment URL').describe('URL of the attachment'),
      previewUrl: z.string().url().optional().title('Attachment Preview URL').describe('URL of the attachment preview'),
      previewUrl2x: z
        .string()
        .url()
        .optional()
        .title('Attachment Preview URL 2x')
        .describe('URL of the attachment preview at up to 2x the resolution'),
    })
    .title('Attachment')
    .describe('Attachment that was added to the card'),
})

export const attachmentRemovedFromCardEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  attachment: z
    .object({
      id: trelloIdSchema.title('Attachment ID').describe('Unique identifier of the attachment'),
      name: z.string().title('Attachment Name').describe('Name of the attachment'),
    })
    .title('Attachment')
    .describe('Attachment that was deleted from the card'),
})
