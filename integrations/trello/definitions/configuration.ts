import { IntegrationDefinitionProps, z } from '@botpress/sdk'
import { trelloIdRegex } from './schemas'

const _optionalTrelloIdRegex = new RegExp(`^$|${trelloIdRegex.source}`)

export const configuration = {
  schema: z.object({
    trelloApiKey: z
      .string()
      .title('Trello API Key')
      .describe("Can be found in the app's settings within the Trello apps admin page")
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
    trelloApiSecret: z
      .string()
      .secret()
      .optional()
      .title('Trello API Secret')
      .describe(
        "Can be found in the app's settings within the Trello apps admin page. (Only used if the Trello Board ID is provided)"
      ),
  }),
} as const satisfies NonNullable<IntegrationDefinitionProps['configuration']>
