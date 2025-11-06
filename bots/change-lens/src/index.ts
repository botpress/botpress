import axios from 'axios'
import * as cheerio from 'cheerio'
import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {},
})

bot.on.event('*', async (props) => {
  const { state } = await props.client.getState({ name: 'metaApiVersions', type: 'bot', id: props.ctx.botId })
  const graphApiVersion = state.payload.graphApiVersion

  const response = await axios.get('https://developers.facebook.com/docs/graph-api/changelog/')
  const selector = cheerio.load(response.data)
  const newGraphApiVersion = selector('code').first().text()
  if (graphApiVersion !== newGraphApiVersion) {
    props.logger.info('Graph api version changed to:', selector('code').first().text())
    await props.client.setState({
      id: props.ctx.botId,
      name: 'metaApiVersions',
      type: 'bot',
      payload: { graphApiVersion: newGraphApiVersion },
    })
  }
})

export default bot
