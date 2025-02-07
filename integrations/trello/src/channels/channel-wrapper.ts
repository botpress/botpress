import { createChannelWrapper } from '@botpress/common'
import { TrelloClient } from 'src/trello-api/trello-client'
import * as bp from '.botpress'

export const wrapChannel = createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    trelloClient: ({ ctx }) => new TrelloClient({ ctx }),
  },
})
