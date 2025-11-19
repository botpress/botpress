import { RuntimeError } from '@botpress/sdk'
import { getCredentials, InstagramClient } from 'src/misc/client'
import * as bp from '.botpress'

export const commentReplies: bp.IntegrationProps['channels']['commentReplies'] = {
  messages: {
    text: async (props) => {
      const { ack, ctx, client, logger, payload, conversation } = props
      const { id } = conversation.tags

      if (!id) {
        throw new RuntimeError('No id found for conversation')
      }

      await _sendCommentMessage(ack, ctx, client, logger, payload.text, id)
    },
  },
}

async function _sendCommentMessage(
  ack: bp.AnyAckFunction,
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger,
  message: string,
  id: string
) {
  const { accessToken, instagramId } = await getCredentials(client, ctx)
  const instagramClient = new InstagramClient(logger, { accessToken, instagramId })
  const { message_id } = await instagramClient.replyToComment(id, message)

  await ack({
    tags: {
      id: message_id,
    },
  })
}
