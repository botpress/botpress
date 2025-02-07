import { Conversation } from '@botpress/client'
import { Responder } from './api-utils'
import * as bp from '.botpress'

type MessageSource = 'from_patient' | 'from_agent'
const getMessageSource = (conversation: Conversation): MessageSource => {
  if (conversation.integration === 'zendesk') {
    return 'from_agent'
  }
  return 'from_patient'
}

const bot = new bp.Bot({ actions: {} })

bot.on.message('*', async (props) => {
  const source = getMessageSource(props.conversation)
  if (source !== 'from_agent') {
    return
  }

  const { conversation: downstreamConversation } = props
  await Responder.from(props).respond({
    conversationId: downstreamConversation.id,
    text: 'HITL is currently disabled.',
  })
})

bot.on.message('*', async (props) => {
  const source = getMessageSource(props.conversation)
  if (source !== 'from_patient') {
    return
  }

  const { conversation: upstreamConversation, user: upstreamUser } = props

  if (props.message.type === 'text' && props.message.payload.text.trim() === '/start_hitl') {
    await props.client.updateUser({
      id: upstreamUser.id,
      tags: {
        email: upstreamUser.tags.email ?? 'john.doe@botpress.com',
      },
      name: 'John Doe',
      pictureUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e7/Steve_%28Minecraft%29.png',
    })

    await bot.actionHandlers.startHitl({
      ...props,
      input: {
        title: `Hitl request ${Date.now()}`,
        description: 'I have a problem',
        conversationId: upstreamConversation.id,
        userId: upstreamUser.id,
      },
    })
    return
  }

  if (props.message.type === 'text' && props.message.payload.text.trim() === '/stop_hitl') {
    await bot.actionHandlers.stopHitl({
      ...props,
      input: {
        conversationId: upstreamConversation.id,
      },
    })
    return
  }

  await Responder.from(props).respond({
    conversationId: upstreamConversation.id,
    text: [
      'Hi, I am a bot.',
      'I cannot answer your questions.',
      'Type `/start_hitl` to talk to a human agent.',
      'Have fun :)',
    ].join('\n'),
  })
})

export default bot
