import { IntegrationDefinitionProps, z } from '@botpress/sdk'
import { trelloIdRegex } from './schemas'

const _optionalTrelloIdRegex = new RegExp(`^$|${trelloIdRegex.source}`)

export const configuration = {
  schema: z.object({
    trelloApiKey: z
      .string()
      .title('Trello API Key')
      .describe('Can be obtained by creating an application on Trello')
      .secret(),
    trelloApiToken: z
      .string()
      .title('Trello API Token')
      .describe('Can be obtained by granting access to the application on Trello')
      .secret(),
    trelloBoardId: z
      .string()
      .regex(_optionalTrelloIdRegex)
      .optional()
      .title('Trello Board ID')
      .describe('Unique identifier of the board to watch for events on Trello'),
  }),
} as const satisfies NonNullable<IntegrationDefinitionProps['configuration']>
