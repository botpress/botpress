import { bot } from './bot'
import { messageHandler } from './message-handler'

bot.on.message('*', messageHandler(bot))
export default bot
