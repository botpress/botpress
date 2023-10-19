import { bot } from './bot'
import { ApiUtils } from './utils'

bot.message(async (props) => {
  const utils = new ApiUtils(props)
  await utils.respond('Hello, world!')
})

export default bot
