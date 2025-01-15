import { createChannelWrapper } from '@botpress/common'
import { TodoistClient } from 'src/todoist-api'
import * as bp from '.botpress'

export const wrapChannel = createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    todoistClient: TodoistClient.create,
  },
})
