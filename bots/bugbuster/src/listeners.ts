import { BotListeners, EventHandlerProps } from './bot'

type Props = Omit<EventHandlerProps, 'event'>
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
