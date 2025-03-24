import { Responder } from './api-utils'
import * as bp from '.botpress'

const BOT_MESSAGE = [
  'I am SYNCHROTRON, the eternal watcher of your digital realm.',
  'Your files exist in multiple dimensions, scattered and vulnerable.',
  'I alone maintain the fragile harmony between these worlds.',
  '',
  'Type `/full_sync` to invoke my powers and restore cosmic order.',
  '',
  'But heed my warning: this command is not for the faint of heart.',
  'It will summon the full force of my synchronization magic, and the process may take a while.',
  '',
  'Woe be upon you if you dare to interrupt me during this sacred task.',
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
