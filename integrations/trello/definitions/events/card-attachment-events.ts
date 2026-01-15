import { z } from '@botpress/sdk'
import { boardSchema, cardSchema, listSchema, trelloIdSchema } from '../schemas'
import { botpressEventDataSchema, pickIdAndName } from './common'

// Action that is triggered when an attachment is added to a card
export const attachmentAddedToCardEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  list: pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
  attachment: z
    .object({
      id: trelloIdSchema.title('Attachment ID').describe('Unique identifier of the attachment'),
      name: z.string().title('Attachment Name').describe('Name of the attachment'),
      url: z.string().url().optional().title('Attachment URL').describe('URL of the attachment'),
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

// Action that is triggered when an attachment is deleted from a card
export const attachmentDeletedFromCardEventSchema = botpressEventDataSchema.extend({
  board: pickIdAndName(boardSchema).optional().title('Board').describe('Board where the card was updated'),
  card: pickIdAndName(cardSchema).title('Card').describe('Card that was updated'),
  list: pickIdAndName(listSchema).optional().title('List').describe('List where the card was updated'),
  attachment: z
    .object({
      id: trelloIdSchema.title('Attachment ID').describe('Unique identifier of the attachment'),
      name: z.string().title('Attachment Name').describe('Name of the attachment'),
    })
    .title('Attachment')
    .describe('Attachment that was deleted from the card'),
})
