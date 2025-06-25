import { Responder } from './api-utils'
import * as bp from '.botpress'

const BOT_MESSAGE = [
  'Greetings, Mission Control! This is NOTIONAUT reporting for duty.',
  "I'm your dedicated space explorer navigating the vast universe of your Notion workspace.",
  'My mission: to safely transport your files across the digital cosmos.',
  '',
  'Type `/full_sync` to initiate launch sequence and begin orbital file transfer.',
  '',
  'Be advised: full synchronization requires completing all mission checkpoints.',
  'This cosmic journey may take some time as we traverse the information galaxy.',
  '',
  'Please maintain communication silence during critical transfer operations.',
  'Prepare for synchronization countdown. T-minus 10, 9, 8... awaiting your command!',
].join('\n')
const bot = new bp.Bot({ actions: {} })

bot.on.message('*', async (props) => {
  if (props.message.type === 'text' && props.message.payload.text.trim() === '/full_sync') {
    await bot.actionHandlers['file-synchronizer#syncFilesToBotpess']({ ...props, input: {} })
    return
  }

  await Responder.from(props).respond({
    conversationId: props.conversation.id,
    text: BOT_MESSAGE,
  })
})

export default bot
