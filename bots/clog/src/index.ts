import axios from 'axios'
import * as cheerio from 'cheerio'
import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {},
})

const _handleApiChange = async (
  message: string,
  graphApiVersion: string,
  props: bp.EventHandlerProps
): Promise<void> => {
  const { client, logger } = props
  logger.info(message)
  const response = await props.client.callAction({
    type: 'slack:startChannelConversation',
    input: {
      channelName: 'test-faucon',
    },
  })
  await props.client.createMessage({
    type: 'text',
    conversationId: response.output.conversationId,
    tags: {},
    userId: props.ctx.botId,
    payload: {
      text: message,
    },
  })
  await client.setState({
    name: 'metaApiVersions',
    type: 'bot',
    id: props.ctx.botId,
    payload: { graphApiVersion },
  })
}

bot.on.event('timeToCheckApi', async (props) => {
  const { state } = await props.client.getOrSetState({
    name: 'metaApiVersions',
    type: 'bot',
    id: props.ctx.botId,
    payload: { graphApiVersion: undefined },
  })
  const graphApiVersion = state.payload.graphApiVersion

  const response = await axios.get('https://developers.facebook.com/docs/graph-api/changelog/')
  const selector = cheerio.load(response.data)
  const newGraphApiVersion = selector('code').first().text()
  if (graphApiVersion === undefined) {
    await _handleApiChange(
      `I'll notify you when Meta's Graph API version will change.\nThe current version is ${newGraphApiVersion}`,
      newGraphApiVersion,
      props
    )
    return
  }
  if (graphApiVersion !== newGraphApiVersion) {
    await _handleApiChange(`Meta's Graph API version changed to: ${newGraphApiVersion}`, newGraphApiVersion, props)
  }
})

export default bot
