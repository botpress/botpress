import { RuntimeError } from '@botpress/sdk'
import { getCredentials, InstagramClient } from 'src/misc/client'
import * as bp from '.botpress'

export const comment: bp.IntegrationProps['channels']['comment'] = {
  messages: {
    text: async (props) => {
      const { ack, ctx, client, logger, payload, conversation } = props
      const { id } = conversation.tags

      if (!id) {
        throw new RuntimeError('No id found for conversation')
      }

      await _sendCommentMessage(ack, ctx, client, logger, payload.text, id)
    },
    image: () => {
      throw new RuntimeError('Not implemented')
    },
    audio: () => {
      throw new RuntimeError('Not implemented')
    },
    file: () => {
      throw new RuntimeError('Not implemented')
    },
    video: () => {
      throw new RuntimeError('Not implemented')
    },
    location: () => {
      throw new RuntimeError('Not implemented')
    },
    carousel: () => {
      throw new RuntimeError('Not implemented')
    },
    card: () => {
      throw new RuntimeError('Not implemented')
    },
    dropdown: () => {
      throw new RuntimeError('Not implemented')
    },
    choice: () => {
      throw new RuntimeError('Not implemented')
    },
    bloc: () => {
      throw new RuntimeError('Not implemented')
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
  const metaClient = new InstagramClient(logger, { accessToken, instagramId })
  const { message_id } = await metaClient.replyToComment(id, message)

  await ack({
    tags: {
      id: message_id,
    },
  })
}
