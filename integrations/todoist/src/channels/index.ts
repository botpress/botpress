import * as bp from '.botpress'
import { TaskCommentPublisher } from './publishers/task-comment'

export const channels = {
  comments: {
    messages: {
      text: TaskCommentPublisher.publishTextMessage,
    },
  },
} as const satisfies bp.IntegrationProps['channels']
