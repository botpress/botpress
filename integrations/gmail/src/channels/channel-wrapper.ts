import { createChannelWrapper } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { GoogleClient, wrapWithTryCatch } from '../google-api'
import { renewWatchIfExpiring } from '../watch'
import * as bp from '.botpress'

export const wrapChannel: typeof _injectTools = (meta, channelImpl) =>
  _injectTools(meta, (props) =>
    wrapWithTryCatch(() => {
      props.logger
        .forBot()
        .debug(
          `Sending message of type "${meta.messageType}" on channel "${meta.channelName}" for bot "${props.ctx.botId}"`
        )
      return channelImpl(props as Parameters<typeof channelImpl>[0])
    }, `Unable to send message of type "${meta.messageType}" on channel "${meta.channelName}"`)()
  )

const _injectTools = createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    async googleClient({ client, ctx, logger }) {
      const googleClient = await GoogleClient.create({ client, ctx })
      await renewWatchIfExpiring({ client, ctx, logger, getGoogleClient: async () => googleClient })
      return googleClient
    },

    async inReplyTo({ client, conversation }) {
      const { state } = await client.getState({
        type: 'conversation',
        name: 'thread',
        id: conversation.id,
      })

      if (!state.payload.inReplyTo) {
        throw new sdk.RuntimeError('Attempting to reply to a message, but no inReplyTo tag was found')
      }

      return state.payload.inReplyTo
    },
  },
})
