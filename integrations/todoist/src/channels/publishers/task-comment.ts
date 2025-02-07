import * as sdk from '@botpress/sdk'
import { wrapChannel } from '../channel-wrapper'

export namespace TaskCommentPublisher {
  export const publishTextMessage = wrapChannel(
    { channelName: 'comments', messageType: 'text' },
    async ({ todoistClient, conversation, ack, payload, logger }) => {
      if (!conversation.tags.id) {
        throw new sdk.RuntimeError('Task id must be set')
      }

      const taskId = conversation.tags.id
      const content = payload.text

      logger.forBot().info(`Creating comment on task "${taskId}" with content: "${content}"`)
      const newComment = await todoistClient.commentOnTask({ taskId, content })

      await ack({ tags: { id: newComment.id } })
    }
  )
}
