import { mkRespond } from 'src/api-utils'
import { MessageHandlers } from '.botpress'
import * as bp from '.botpress'

export const patientMessageHandler =
  (bot: bp.Bot): MessageHandlers['*'] =>
  async (props) => {
    if (props.message.type !== 'text') {
      return
    }

    const respond = mkRespond(props)
    const { message, conversation: upstreamConversation, user: upstreamUser } = props

    if (message.payload.text.trim() === '/start_hitl') {
      await bot.actionHandlers.startHitl({
        ...props,
        input: {
          title: `Hitl request ${Date.now()}`,
          conversationId: upstreamConversation.id,
          userId: upstreamUser.id,
        },
      })
      return
    }

    if (message.payload.text.trim() === '/stop_hitl') {
      await bot.actionHandlers.stopHitl({
        ...props,
        input: {
          conversationId: upstreamConversation.id,
          userId: upstreamUser.id,
        },
      })
      return
    }

    await respond({
      conversationId: upstreamConversation.id,
      text: [
        'Hi, I am a bot.',
        'I cannot answer your questions.',
        'Type `/start_hitl` to talk to a human agent.',
        'Have fun :)',
      ].join('\n'),
    })
  }
