import { createChannelWrapper } from '@botpress/common'
import { GoogleClient, wrapWithTryCatch } from '../google-api'
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
    async googleClient({ client, ctx }) {
      return await GoogleClient.create({ client, ctx })
    },
  },
})
