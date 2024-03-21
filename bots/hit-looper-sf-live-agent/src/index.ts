import { bot } from './bot'
import { eventHandler } from './event-handler'
import { messageHandler } from './message-handler'

bot.message(messageHandler)
bot.event(eventHandler)

export default bot
