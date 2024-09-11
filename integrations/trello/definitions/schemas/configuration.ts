import { z } from '@botpress/sdk'
import { BoardSchema } from './entities'

export const TrelloConfigSchema = z.object({
  trelloApiKey: z.string().describe('Can be obtained by creating an application on Trello').secret(),
  trelloApiToken: z.string().describe('Can be obtained by granting access to the application on Trello').secret(),
  trelloBoardId: BoardSchema.shape.id
    .describe('Unique identifier of the board to watch for events on Trello')
    .optional(),
})

export type TrelloConfig = z.infer<typeof TrelloConfigSchema>
