import * as bp from '.botpress'

type Props = Omit<bp.EventHandlerProps, 'event'>
type Message = Pick<bp.ClientInputs['createMessage'], 'type' | 'payload'>
type BotListeners = bp.states.listeners.Listeners

const emptyListeners: BotListeners = {
  conversationIds: [],
}

export const readListeners = async (props: Props): Promise<BotListeners> => {
  try {
    const {
      state: { payload: listeners },
    } = await props.client.getState({
      id: props.ctx.botId,
      type: 'bot',
      name: 'listeners',
    })
    return listeners
  } catch (err) {
    return emptyListeners
  }
}

export const writeListeners = async (props: Props, state: BotListeners) => {
  await props.client.setState({
    id: props.ctx.botId,
    type: 'bot',
    name: 'listeners',
    payload: state,
  })
}

export const notifyListeners = async (props: Props, message: Message) => {
  const state = await readListeners(props)
  console.info(`Sending message to ${state.conversationIds.length} conversation(s)`)
  for (const conversationId of state.conversationIds) {
    await props.client.createMessage({
      conversationId,
      userId: props.ctx.botId,
      tags: {},
      ...message,
    })
  }
}
