import { ResourceNotFoundError } from '@botpress/client'
import { MessageHandlerProps, BotStates } from './types'

type FlowState = BotStates['flow']
export const findFlow = async (
  props: Pick<MessageHandlerProps, 'client'> & { conversationId: string }
): Promise<FlowState | undefined> => {
  const { client, conversationId } = props
  try {
    const { state } = await client.getState({ name: 'flow', type: 'conversation', id: conversationId })
    return state.payload
  } catch (thrown) {
    if (thrown instanceof ResourceNotFoundError) {
      return
    }
    throw thrown
  }
}

export const getOrCreateFlow = async (
  props: Pick<MessageHandlerProps, 'client'> & { conversationId: string },
  initFlow: FlowState
): Promise<FlowState> => {
  const { client, conversationId } = props
  const currentFlow = await findFlow({ client, conversationId })
  if (currentFlow) {
    return currentFlow
  }

  await client.setState({
    name: 'flow',
    type: 'conversation',
    id: conversationId,
    payload: initFlow,
  })
  return initFlow
}

export const setFlow = async (
  props: Pick<MessageHandlerProps, 'client'> & { conversationId: string },
  flow: FlowState
): Promise<FlowState> => {
  const { client, conversationId } = props
  const { state: updatedFlow } = await client.setState({
    name: 'flow',
    type: 'conversation',
    id: conversationId,
    payload: flow,
  })
  return updatedFlow.payload
}
