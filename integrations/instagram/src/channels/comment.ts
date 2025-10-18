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
      throw new RuntimeError('Images are not supported for comments. Use the text message instead.')
    },
    audio: () => {
      throw new RuntimeError('Audio is not supported for comments. Use the text message instead.')
    },
    file: () => {
      throw new RuntimeError('Files are not supported for comments. Use the text message instead.')
    },
    video: () => {
      throw new RuntimeError('Videos are not supported for comments. Use the text message instead.')
    },
    location: () => {
      throw new RuntimeError('Locations are not supported for comments. Use the text message instead.')
    },
    carousel: () => {
      throw new RuntimeError('Carousels are not supported for comments. Use the text message instead.')
    },
    card: () => {
      throw new RuntimeError('Cards are not supported for comments. Use the text message instead.')
    },
    dropdown: () => {
      throw new RuntimeError('Dropdowns are not supported for comments. Use the text message instead.')
    },
    choice: () => {
      throw new RuntimeError('Choices are not supported for comments. Use the text message instead.')
    },
    bloc: () => {
      throw new RuntimeError('Blocs are not supported for comments. Use the text message instead.')
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
