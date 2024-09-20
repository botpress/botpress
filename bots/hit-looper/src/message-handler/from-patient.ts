import { mkRespond } from 'src/api-utils'
import { getOrCreateFlow, setFlow } from '../flow-state'
import { MessageHandler } from '../types'

export const patientMessageHandler: MessageHandler = async (props) => {
  if (props.message.type !== 'text') {
    return
  }

  const respond = mkRespond(props)
  const { message, client, conversation: upstreamConversation, user: upstreamUser } = props

  const upstreamFlow = await getOrCreateFlow(
    { client, conversationId: upstreamConversation.id },
    { hitlEnabled: false }
  )

  if (!upstreamFlow.hitlEnabled) {
    if (message.payload.text.trim() === '/start_hitl') {
      const {
        output: { userId: downstreamUserId },
      } = await client.callAction({
        // TODO: get these from the user or the upstream integration
        type: 'zendesk:createUser',
        input: {
          name: 'John Doe',
          pictureUrl: 'https://en.wikipedia.org/wiki/Steve_(Minecraft)#/media/File:Steve_(Minecraft).png',
          email: 'john.doe@foobar.com',
        },
      })

      await client.updateUser({
        id: upstreamUser.id,
        tags: {
          downstream: downstreamUserId,
        },
      })

      await client.updateUser({
        id: downstreamUserId,
        tags: {
          upstream: upstreamUser.id,
        },
      })

      const {
        output: { conversationId: downstreamConversationId },
      } = await client.callAction({
        type: 'zendesk:startHitl',
        input: {
          title: `Hitl request ${Date.now()}`,
          description: 'I need help.',
          userId: downstreamUserId,
        },
      })

      await client.updateConversation({
        id: upstreamConversation.id,
        tags: {
          downstream: downstreamConversationId,
        },
      })

      await client.updateConversation({
        id: downstreamConversationId,
        tags: {
          upstream: upstreamConversation.id,
        },
      })

      await setFlow({ client, conversationId: upstreamConversation.id }, { hitlEnabled: true })
      await setFlow({ client, conversationId: downstreamConversationId }, { hitlEnabled: true })
      await respond({ conversationId: upstreamConversation.id, text: 'Transfering you to a human agent...' })
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
    return
  }

  const downstreamConversationId = upstreamConversation.tags['downstream']
  if (!downstreamConversationId) {
    console.error('Upstream conversation was not binded to downstream conversation')
    await respond({
      conversationId: upstreamConversation.id,
      text: 'Something went wrong, you are not connected to a human agent...',
    })
    return
  }

  const downstreamUserId = upstreamUser.tags['downstream']
  if (!downstreamUserId) {
    console.error('Upstream user was not binded to downstream user')
    await respond({
      conversationId: upstreamConversation.id,
      text: 'Something went wrong, you are not connected to a human agent...',
    })
    return
  }

  console.info('Sending message to downstream')
  await respond({ conversationId: downstreamConversationId, userId: downstreamUserId, text: message.payload.text })
}
