import { bot } from './bot'
import { messageHandler } from './message-handler'

bot.message(messageHandler)
export default bot
