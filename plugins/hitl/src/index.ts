import * as conv from './state-manager'
import * as bp from '.botpress'

const bot = new bp.Plugin({
  actions: {
    startHitl: async (props) => {
      await props.actions.hitl.startHitl({
        title: 'Hitl',
        description: 'Hitl',
        userId: props.input.userId,
        messageHistory: [],
      })
      return {}
    },
  },
})

const handleDownstreamMessage: bp.HookHandlers['before_incoming_message']['*'] = async (props) => {
  if (props.data.type !== 'text') {
    return undefined
  }

  const cm = conv.ConversationManager.from(props)
  const hitlState = await cm.getHitlState(props.data.conversationId)
  if (!hitlState.hitlActive) {
    return undefined
  }

  return undefined
}

const handleUpstreamMessage: bp.HookHandlers['before_incoming_message']['*'] = async (props) => {
  if (props.data.type !== 'text') {
    return undefined
  }

  const cm = conv.ConversationManager.from(props)
  const hitlState = await cm.getHitlState(props.data.conversationId)
  if (!hitlState.hitlActive) {
    return undefined
  }

  return undefined
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
