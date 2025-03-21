import { Responder } from './api-utils'
import * as bp from '.botpress'

const BOT_MESSAGE = [
  'Hi, I am a bot.',
  'I cannot answer your questions.',
  'Type `/full_sync` to start a sync operation.',
  'Have fun :)',
].join('\n')
const bot = new bp.Bot({ actions: {} })

bot.on.message('*', async (props) => {
  if (props.message.type === 'text' && props.message.payload.text.trim() === '/full_sync') {
    await bot.actionHandlers.syncFilesToBotpess({ ...props, input: {} })
    return
  }

  await Responder.from(props).respond({
    conversationId: props.conversation.id,
    text: BOT_MESSAGE,
  })
})

export default bot
