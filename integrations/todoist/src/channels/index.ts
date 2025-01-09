import { TaskCommentPublisher } from './publishers/task-comment'
import * as bp from '.botpress'

export const channels = {
  comments: {
    messages: {
      text: TaskCommentPublisher.publishTextMessage,
    },
  },
} as const satisfies bp.IntegrationProps['channels']
