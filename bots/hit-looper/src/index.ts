import { bot } from './bot'
import { messageHandler } from './message-handler'

bot.on.message('*', messageHandler)
export default bot
