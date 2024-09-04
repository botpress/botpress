import { z } from '@botpress/sdk'
import { createCsvRegex } from 'src/utils'
import { TrelloIDSchema } from '..'
import { trelloIdRegex } from '../primitives/trelloId'

export const updateCardInputSchema = z
  .object({
    cardId: TrelloIDSchema.describe('ID of the card to update'),
    name: z
      .string()
      .optional()
      .describe('The name of the card (Optional) (e.g. "My Test Card"). Leave empty to keep the current name.'),
    bodyText: z
      .string()
      .optional()
      .describe('Body text of the new card (Optional). Leave empty to keep the current body.'),
    closedState: z
      .enum(['open', 'archived'])
      .optional()
      .describe(
        'Whether the card should be archived (Optional). Enter "open", "archived" (without quotes), or leave empty to keep the previous status.'
      )
      .optional(),
    completeState: z
      .enum(['complete', 'incomplete'])
      .optional()
      .describe(
        'Whether the card should be marked as complete (Optional). Enter "complete", "incomplete" (without quotes), or leave empty to keep the previous status.'
      )
      .optional(),
    membersToAdd: z
      .string()
      .regex(createCsvRegex(trelloIdRegex))
      .optional()
      .describe(
        'Members to add to the card (Optional). This should be a CSV list of member IDs. Leave empty to keep the current members.'
      ),
    membersToRemove: z
      .string()
      .regex(createCsvRegex(trelloIdRegex))
      .optional()
      .describe(
        'Members to remove from the card (Optional). This should be a CSV list of member IDs. Leave empty to keep the current members.'
      ),
    labelsToAdd: z
      .string()
      .regex(createCsvRegex(trelloIdRegex))
      .optional()
      .describe(
        'Labels to add to the card (Optional). This should be a CSV list of label IDs. Leave empty to keep the current labels.'
      ),
    labelsToRemove: z
      .string()
      .regex(createCsvRegex(trelloIdRegex))
      .optional()
      .describe(
        'Labels to remove from the card (Optional). This should be a CSV list of label IDs. Leave empty to keep the current labels.'
      ),
    dueDate: z
      .string()
      .datetime()
      .optional()
      .describe('The due date of the card in ISO 8601 format (Optional). Leave empty to keep the current due date.'),
  })
  .describe('Input schema for creating a new card')
