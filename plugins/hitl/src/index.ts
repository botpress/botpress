import * as conv from './conv-manager'
import * as user from './user-linker'
import * as bp from '.botpress'

const bot = new bp.Plugin({
  actions: {
    startHitl: async (props) => {
      const { conversationId: upstreamConversationId, userId: upstreamUserId } = props.input

      const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)
      const hitlState = await upstreamCm.getHitlState()
      if (hitlState.hitlActive) {
        return {}
      }

      const users = new user.UserLinker(props)
      const downstreamUserId = await users.getDownstreamUserId(upstreamUserId)

      const { conversationId: downstreamConversationId } = await props.actions.hitl.startHitl({
        title: 'Hitl',
        description: 'Hitl',
        userId: downstreamUserId,
        messageHistory: [], // TODO: pass message history
      })

      const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)

      await props.client.updateConversation({
        id: upstreamConversationId,
        tags: {
          downstream: downstreamConversationId,
        },
      })

      await props.client.updateConversation({
        id: downstreamConversationId,
        tags: {
          upstream: upstreamConversationId,
        },
      })

      await upstreamCm.setHitlState({ hitlActive: true })
      await downstreamCm.setHitlState({ hitlActive: true })
      return {}
    },

    stopHitl: async (props) => {
      const { conversationId: upstreamConversationId } = props.input

      const upstreamCm = conv.ConversationManager.from(props, upstreamConversationId)
      const hitlState = await upstreamCm.getHitlState()
      if (!hitlState.hitlActive) {
        return {}
      }

      // TODO: implement
      // try {
      //   await respond({
      //     conversationId: upstreamConversation.id,
      //     text: 'Closing ticket...',
      //   })
      //   await props.client.callAction({
      //     type: 'zendesk:stopHitl',
      //     input: {
      //       conversationId: downstreamConversationId,
      //     },
      //   })
      //   await respond({
      //     conversationId: upstreamConversation.id,
      //     text: 'Ticket closed...',
      //   })
      // } finally {
      //   await setFlow({ client, conversationId: upstreamConversation.id }, { hitlEnabled: false })
      //   await setFlow({ client, conversationId: downstreamConversationId }, { hitlEnabled: false })
      // }

      return {}
    },
  },
})

const handleDownstreamMessage: bp.HookHandlers['before_incoming_message']['*'] = async (props) => {
  if (props.data.type !== 'text') {
    return undefined
  }

  const downstreamCm = conv.ConversationManager.from(props, props.data.conversationId)
  const hitlState = await downstreamCm.getHitlState()
  if (!hitlState.hitlActive) {
    return undefined
  }

  // TODO: implement
  // if (!flow.hitlEnabled) {
  //   await respond({
  //     conversationId: downstreamConversation.id,
  //     text: 'Hitl is not enabled so nobody is reading your messages',
  //   })
  //   return
  // }

  // const upstreamConversationId = downstreamConversation.tags['upstream']
  // if (!upstreamConversationId) {
  //   throw new Error('Downstream conversation was not binded to upstream conversation')
  // }

  // if (message.payload.text.trim() === '/stop_hitl') {
  //   await setFlow({ client, conversationId: downstreamConversation.id }, { hitlEnabled: false })
  //   await setFlow({ client, conversationId: upstreamConversationId }, { hitlEnabled: false })

  //   const disabledMsg = 'Hitl has been disabled'
  //   await respond({ conversationId: downstreamConversation.id, text: disabledMsg })
  //   await respond({ conversationId: upstreamConversationId, text: disabledMsg })
  //   return
  // }
  // await respond({ conversationId: upstreamConversationId, text: message.payload.text })

  return undefined
}

const handleUpstreamMessage: bp.HookHandlers['before_incoming_message']['*'] = async (props) => {
  if (props.data.type !== 'text') {
    return undefined
  }

  const upstreamCm = conv.ConversationManager.from(props, props.data.conversationId)

  const hitlState = await upstreamCm.getHitlState()
  if (!hitlState.hitlActive) {
    return undefined
  }

  const { conversation: upstreamConversation } = await props.client.getConversation({ id: props.data.conversationId })
  const { user: upstreamUser } = await props.client.getUser({ id: props.data.userId })

  const downstreamConversationId = upstreamConversation.tags['downstream']
  if (!downstreamConversationId) {
    console.error('Upstream conversation was not binded to downstream conversation')
    await upstreamCm.respond({ text: 'Something went wrong, you are not connected to a human agent...' })
    return
  }

  const downstreamUserId = upstreamUser.tags['downstream']
  if (!downstreamUserId) {
    console.error('Upstream user was not binded to downstream user')
    await upstreamCm.respond({ text: 'Something went wrong, you are not connected to a human agent...' })
    return
  }

  const downstreamCm = conv.ConversationManager.from(props, downstreamConversationId)

  console.info('Sending message to downstream')
  await downstreamCm.respond({
    userId: downstreamUserId,
    text: props.data.payload.text,
  })

  return { stop: true } // do not propagate the message to the bot handlers
}

bot.on.beforeIncomingMessage('*', async (props) => {
  const { conversation } = await props.client.getConversation({
    id: props.data.conversationId,
  })
  const { integration } = conversation
  if (integration === props.interfaces.hitl.name) {
    return await handleDownstreamMessage(props)
  }
  return await handleUpstreamMessage(props)
})

export default bot
