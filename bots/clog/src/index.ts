import axios from 'axios'
import * as cheerio from 'cheerio'
import * as bp from '.botpress'

const SLACK_CHANNEL_TO_PING = 'alert-squid'

const bot = new bp.Bot({
  actions: {},
})

const _handleApiChange = async (
  message: string,
  newGraphApiVersion: string | undefined,
  props: bp.EventHandlerProps
): Promise<void> => {
  const { client, logger } = props
  logger.info(message)
  const response = await props.client.callAction({
    type: 'slack:startChannelConversation',
    input: {
      channelName: SLACK_CHANNEL_TO_PING,
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
    payload: { currentGraphApiVersion: newGraphApiVersion },
  })
}

// Checks if starts with v, has a number of at least one digit, a dot and a single digit (e.g. v00.0)
const versionRegexp: RegExp = /v\d+.\d/i
const isVersionString = (s: string): boolean => versionRegexp.test(s)

bot.on.event('timeToCheckApi', async (props) => {
  const { client, ctx, logger } = props
  const { state } = await client.getOrSetState({
    name: 'metaApiVersions',
    type: 'bot',
    id: ctx.botId,
    payload: { currentGraphApiVersion: undefined },
  })
  const currentGraphApiVersion = state.payload.currentGraphApiVersion

  const response = await axios.get('https://developers.facebook.com/docs/graph-api/changelog/')
  const selector = cheerio.load(response.data)
  const newGraphApiVersion = selector('code').first().text().trim()

  if (!isVersionString(newGraphApiVersion)) {
    await _handleApiChange(
      `I failed reading the Meta's API version, I received\n${newGraphApiVersion}`,
      undefined,
      props
    )
  } else if (currentGraphApiVersion === undefined) {
    await _handleApiChange(
      `I'll notify you when Meta's Graph API version will change.\nThe current version is ${newGraphApiVersion}`,
      newGraphApiVersion,
      props
    )
  } else if (currentGraphApiVersion !== newGraphApiVersion) {
    await _handleApiChange(`Meta's Graph API version changed to: ${newGraphApiVersion}`, newGraphApiVersion, props)
  } else {
    logger.info(`Meta's Graph API version is ${newGraphApiVersion}`)
  }
})

export default bot
