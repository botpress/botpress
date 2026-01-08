import { ActionDefinition, z } from '@botpress/sdk'
import { cardSchema, listSchema, trelloIdSchema } from 'definitions/schemas'
import { hasCardId, hasListId, hasMessage, outputsCard, outputsCards } from './common'

export const getCardById = {
  title: 'Get card by ID',
  description: 'Get a card by its unique identifier',
  input: {
    schema: hasCardId.describe('Input schema for getting a card from its ID'),
  },
  output: {
    schema: outputsCard.describe('Output schema for getting a card from its ID'),
  },
} as const satisfies ActionDefinition

export const getCardsByDisplayName = {
  title: 'Find cards by name name',
  description: 'Find all lists whose display name match this name',
  input: {
    schema: hasListId
      .extend({
        cardName: cardSchema.shape.name.title('Card Name').describe('Display name of the card'),
      })
      .describe('Input schema for getting a card ID from its name'),
  },
  output: {
    schema: outputsCards.describe('Output schema for getting a card ID from its name'),
  },
} as const satisfies ActionDefinition

export const getCardsInList = {
  title: 'Get cards in list',
  description: 'Get all cards in a list',
  input: {
    schema: hasListId.describe('Input schema for getting all cards in a list'),
  },
  output: {
    schema: outputsCards.describe('Output schema for getting all cards in a list'),
  },
} as const satisfies ActionDefinition

export const createCard = {
  title: 'Create new card',
  description: 'Create a card and add it to a list',
  input: {
    schema: z
      .object({
        listId: listSchema.shape.id.title('List ID').describe('ID of the list in which to insert the new card'),
        cardName: cardSchema.shape.name.title('Card Name').describe('Name of the new card'),
        cardBody: cardSchema.shape.description.optional().title('Card Body').describe('Body text of the new card'),
        members: z
          .array(trelloIdSchema)
          .optional()
          .title('Members')
          .describe('Members to add to the card (Optional). This should be a list of member IDs.'),
        labels: z
          .array(trelloIdSchema)
          .optional()
          .title('Labels')
          .describe('Labels to add to the card (Optional). This should be a list of label IDs.'),
        dueDate: cardSchema.shape.dueDate
          .optional()
          .title('Due Date')
          .describe('The due date of the card in ISO 8601 format (Optional).'),
      })
      .describe('Input schema for creating a new card'),
  },
  output: {
    schema: hasMessage
      .extend({
        newCardId: cardSchema.shape.id.describe('Unique identifier of the new card'),
      })
      .describe('Output schema for creating a card'),
  },
} as const satisfies ActionDefinition

export const updateCard = {
  title: 'Update card',
  description: 'Update the details of a card',
  input: {
    schema: hasCardId
      .extend({
        name: cardSchema.shape.name
          .optional()
          .title('Name')
          .describe('The name of the card (Optional) (e.g. "My Test Card"). Leave empty to keep the current name.'),
        bodyText: cardSchema.shape.description
          .optional()
          .title('Body Text')
          .describe('Body text of the new card (Optional). Leave empty to keep the current body.'),
        closedState: z
          .enum(['open', 'archived'])
          .optional()
          .title('Closed State')
          .describe(
            'Whether the card should be archived (Optional). Enter "open", "archived" (without quotes), or leave empty to keep the previous status.'
          )
          .optional(),
        completeState: z
          .enum(['complete', 'incomplete'])
          .optional()
          .title('State Completion')
          .describe(
            'Whether the card should be marked as complete (Optional). Enter "complete", "incomplete" (without quotes), or leave empty to keep the previous status.'
          )
          .optional(),
        membersToAdd: z
          .array(trelloIdSchema)
          .optional()
          .title('Members to Add')
          .describe(
            'Members to add to the card (Optional). This should be a list of member IDs. Leave empty to keep the current members.'
          ),
        membersToRemove: z
          .array(trelloIdSchema)
          .optional()
          .title('Members to Remove')
          .describe(
            'Members to remove from the card (Optional). This should be a list of member IDs. Leave empty to keep the current members.'
          ),
        labelsToAdd: z
          .array(trelloIdSchema)
          .optional()
          .title('Labels to Add')
          .describe(
            'Labels to add to the card (Optional). This should be a list of label IDs. Leave empty to keep the current labels.'
          ),
        labelsToRemove: z
          .array(trelloIdSchema)
          .optional()
          .title('Labels to Remove')
          .describe(
            'Labels to remove from the card (Optional). This should be a list of label IDs. Leave empty to keep the current labels.'
          ),
        dueDate: cardSchema.shape.dueDate
          .optional()
          .title('Due Date')
          .describe(
            'The due date of the card in ISO 8601 format (Optional). Leave empty to keep the current due date.'
          ),
      })
      .describe('Input schema for creating a new card'),
  },
  output: {
    schema: hasMessage.describe('Output schema for updating a card'),
  },
} as const satisfies ActionDefinition

export const addCardComment = {
  title: 'Add card comment',
  description: 'Add a new comment to a card',
  input: {
    schema: z
      .object({
        cardId: cardSchema.shape.id
          .title('Card ID')
          .describe('Unique identifier of the card to which a comment will be added'),
        commentBody: z.string().title('Comment Body').describe('The body text of the comment'),
      })
      .describe('Input schema for adding a comment to a card'),
  },
  output: {
    schema: hasMessage
      .extend({
        newCommentId: trelloIdSchema.describe('Unique identifier of the newly created comment'),
      })
      .describe('Output schema for adding a comment to a card'),
  },
} as const satisfies ActionDefinition

const _moveByNSpacesSchema = z.number().min(1).optional().default(1)

export const moveCardUp = {
  title: 'Move card up',
  description: 'Move a card n spaces up',
  input: {
    schema: hasCardId.extend({
      moveUpByNSpaces: _moveByNSpacesSchema
        .title('Move Up By N Spaces')
        .describe('Number of spaces by which to move the card up'),
    }),
  },
  output: {
    schema: hasMessage.describe('Output schema for moving a card up'),
  },
} as const satisfies ActionDefinition

export const moveCardDown = {
  title: 'Move card down',
  description: 'Move a card n spaces down',
  input: {
    schema: hasCardId.extend({
      moveDownByNSpaces: _moveByNSpacesSchema
        .title('Move Down By N Spaces')
        .describe('Number of spaces by which to move the card down'),
    }),
  },
  output: {
    schema: hasMessage.describe('Output schema for moving a card down'),
  },
} as const satisfies ActionDefinition

export const moveCardToList = {
  title: 'Move card to another list',
  description: 'Move a card to another list within the same board',
  input: {
    schema: hasCardId.extend({
      newListId: listSchema.shape.id
        .title('New List ID')
        .describe('Unique identifier of the list in which the card will be moved'),
    }),
  },
  output: {
    schema: hasMessage.describe('Output schema for moving a card to a list'),
  },
} as const satisfies ActionDefinition
