import { ClickUpClient } from './client'
import * as bp from '.botpress'

export const channels: bp.IntegrationProps['channels'] = {
  comment: {
    messages: {
      text: async ({ ctx, payload, ack, conversation }) => {
        const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId)
        const comment = await clickup.createComment({ text: payload.text, taskId: conversation.tags.taskId! })
        await ack({ tags: { id: comment.id.toString() } })
      },
    },
  },
}
