import { z } from '@botpress/sdk'
import { CardSchema } from 'src/schemas/entities/card'
import { ListSchema } from 'src/schemas/entities/list'
import { updateCardInputSchema } from '../updateCardInputSchema'

export const cardUpdateInputSchema = z
  .object({
    id: updateCardInputSchema.shape.cardId,
    item: z.object({
      id: updateCardInputSchema.shape.cardId,
      name: CardSchema.shape.name.describe('Name of the card'),
      description: CardSchema.shape.description.describe('Description of the card'),
      listId: ListSchema.shape.id.describe('ID of the list in which to move the card'),
      isClosed: CardSchema.shape.isClosed.describe('Whether the card is archived'),
      isCompleted: CardSchema.shape.isCompleted.describe('Whether the card is completed'),
      dueDate: updateCardInputSchema.shape.dueDate,
      labelIds: CardSchema.shape.labelIds.describe('IDs of the labels to apply to the card'),
      memberIds: CardSchema.shape.memberIds.describe('IDs of the members to add to the card'),
      verticalPosition: CardSchema.shape.verticalPosition.describe('Position of the card in the list'),
    }),
  })
  .describe('Input schema for updating a new card a card by its ID')
