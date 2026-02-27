import { ActionDefinition, z } from '@botpress/sdk'
import { cardSchema, listSchema, trelloIdSchema } from 'definitions/schemas'
import { hasCardId, hasListId, hasMessage } from './common'

export const getCardById = {
  title: 'Get card by ID',
  description: 'Get a card by its unique identifier',
  input: {
    schema: hasCardId.describe('Input schema for getting a card from its ID'),
  },
  output: {
    schema: z.object({
      card: cardSchema.title('Trello Card').describe("The Trello card that's associated with the given card ID"),
    }),
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
    schema: z.object({
      cards: z.array(cardSchema).title('Trello Cards').describe('A list of cards that match the given card name'),
    }),
  },
} as const satisfies ActionDefinition

export const getCardsInList = {
  title: 'Get cards in list',
  description: 'Get all cards in a list',
  input: {
    schema: hasListId.describe('Input schema for getting all cards in a list'),
  },
  output: {
    schema: z.object({
      cards: z
        .array(cardSchema)
        .title('Trello Cards')
        .describe('An array of cards that are contained within the given list'),
    }),
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
        cardBody: cardSchema.shape.description.optional().title('Card Body').describe('The body text of the new card'),
        memberIds: z
          .array(trelloIdSchema)
          .optional()
          .title('Member IDs')
          .describe('Members to add to the card (Optional). This should be a list of member IDs.'),
        labelIds: z
          .array(trelloIdSchema)
          .optional()
          .title('Label IDs')
          .describe('Labels to add to the card (Optional). This should be a list of label IDs.'),
        dueDate: cardSchema.shape.dueDate
          .optional()
          .title('Due Date')
          .describe('The due date of the card in ISO 8601 format (Optional).'),
        completionStatus: z
          .enum(['Complete', 'Incomplete'])
          .default('Incomplete')
          .title('Completion Status')
          .describe(
            'Whether the card should be marked as complete (Optional). Enter "Complete" or "Incomplete" (without quotes).'
          ),
      })
      .describe('Input schema for creating a new card'),
  },
  output: {
    schema: z
      .object({
        message: hasMessage.shape.message
          .title('Action message')
          .describe('A message that says if the card was successfully created or not'),
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
        cardName: cardSchema.shape.name
          .optional()
          .title('Card Name')
          .describe('The name of the card (Optional) (e.g. "My Test Card"). Leave empty to keep the current name.'),
        cardBody: cardSchema.shape.description
          .optional()
          .title('Card Body')
          .describe('The new body text of the card (Optional). Leave empty to keep the current body.'),
        lifecycleStatus: z
          .enum(['Open', 'Archived'])
          .optional()
          .title('Lifecycle Status')
          .describe(
            'Whether the card should be archived (Optional). Enter "Open", "Archived" (without quotes), or leave empty to keep the previous status.'
          ),
        completionStatus: z
          .enum(['Complete', 'Incomplete'])
          .optional()
          .title('Completion Status')
          .describe(
            'Whether the card should be marked as complete (Optional). Enter "Complete", "Incomplete" (without quotes), or leave empty to keep the previous status.'
          ),
        memberIdsToAdd: z
          .array(trelloIdSchema)
          .optional()
          .title('Member IDs to Add')
          .describe(
            'Members to add to the card (Optional). This should be a list of member IDs. Leave empty to keep the current members.'
          ),
        memberIdsToRemove: z
          .array(trelloIdSchema)
          .optional()
          .title('Member IDs to Remove')
          .describe(
            'Members to remove from the card (Optional). This should be a list of member IDs. Leave empty to keep the current members.'
          ),
        labelIdsToAdd: z
          .array(trelloIdSchema)
          .optional()
          .title('Label IDs to Add')
          .describe(
            'Labels to add to the card (Optional). This should be a list of label IDs. Leave empty to keep the current labels.'
          ),
        labelIdsToRemove: z
          .array(trelloIdSchema)
          .optional()
          .title('Label IDs to Remove')
          .describe(
            'Labels to remove from the card (Optional). This should be a list of label IDs. Leave empty to keep the current labels.'
          ),
        dueDate: cardSchema.shape.dueDate
          .nullable()
          .optional()
          .title('Due Date')
          .describe(
            'The due date of the card in ISO 8601 format (Optional). Set to null to remove the due date or leave empty to keep the current due date.'
          ),
        listId: listSchema.shape.id
          .optional()
          .title('List ID')
          .describe('Unique identifier of the list in which the card will be moved to'),
        /** Note: The validation for "verticalPosition" must be done in the action
         *   implementation, since studio does not support union types in inputs yet
         *   and the JSON schema generation does not support zod runtime validation
         *   like "refine" (at the time of writing, 2026-01-22). */
        verticalPosition: z
          .string()
          .optional()
          .title('Vertical Position')
          .describe(
            'The new position of the card in the list, either "top", "bottom", or a stringified float (Optional). Leave empty to keep the current position.'
          ),
      })
      .describe('Input schema for creating a new card'),
  },
  output: {
    schema: hasMessage.describe('Output schema for updating a card'),
  },
} as const satisfies ActionDefinition

export const deleteCard = {
  title: 'Delete card',
  description: 'Deletes a card by its unique identifier',
  input: {
    schema: z.object({
      cardId: cardSchema.shape.id.title('Card ID').describe('ID of the card to delete'),
      hardDelete: z
        .boolean()
        .default(false)
        .title('Hard Delete')
        .describe(
          'Whether to perform a hard delete or a soft delete (archive). Set to true for hard delete, false for soft delete.'
        ),
    }),
  },
  output: {
    schema: z.object({}),
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
    schema: z.object({
      message: z
        .string()
        .title('Action message')
        .describe('A message that says if the comment was successfully created or not'),
      newCommentId: trelloIdSchema.title('New Comment ID').describe('Unique identifier of the newly created comment'),
    }),
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
        .describe('Unique identifier of the list in which the card will be moved to'),
      /** Note: The validation for "newVerticalPosition" must be done in the action
       *   implementation, since studio does not support union types in inputs yet
       *   and the JSON schema generation does not support zod runtime validation
       *   like "refine" (at the time of writing, 2026-01-22). */
      newVerticalPosition: z
        .string()
        .optional()
        .title('New Vertical Position')
        .describe(
          'The new position of the card in the list, either "top", "bottom", or a stringified float (Optional). Leave empty to keep the current position.'
        ),
    }),
  },
  output: {
    schema: hasMessage.describe('Output schema for moving a card to a list'),
  },
} as const satisfies ActionDefinition
