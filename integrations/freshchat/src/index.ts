import { RuntimeError } from '@botpress/client'
import { actions } from './actions'
import { channels } from './channels'
import { getFreshchatClient } from './client'
import { handler } from './handler'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ client, ctx, logger }) => {
    const freshchatClient = getFreshchatClient({ ...ctx.configuration }, logger)

    if (!(await freshchatClient.verifyToken())) {
      throw new RuntimeError('Invalid API token or domain name')
    }

    const channels = await freshchatClient.getChannels()

    if (!ctx.configuration?.topic_name?.length) {
      throw new RuntimeError('Topic name required')
    }

    const channel = channels.find((channel) => channel.name === ctx.configuration.topic_name)

    if (!channel) {
      throw new RuntimeError(`Topic with name '${ctx.configuration.topic_name}' doesn't exist on your account`)
    }

    await client.setState({
      type: 'integration',
      id: ctx.integrationId,
      name: 'freshchat',
      payload: {
        channelId: channel.id,
      },
    })
  },
  unregister: async () => {},
  actions,
  channels,
  handler,
})
