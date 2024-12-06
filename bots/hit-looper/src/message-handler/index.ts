import { Conversation } from '@botpress/client'
import { MessageHandlers } from '../types'
import { agentMessageHandler } from './from-agent'
import { patientMessageHandler } from './from-patient'

type MessageSource = 'from_patient' | 'from_agent'
const getMessageSource = (conversation: Conversation): MessageSource => {
  if (conversation.integration === 'zendesk') {
    return 'from_agent'
  }
  return 'from_patient'
}

export const messageHandler: MessageHandlers['*'] = async (props) => {
  const source = getMessageSource(props.conversation)
  if (source === 'from_agent') {
    await agentMessageHandler(props)
    return
  }
  await patientMessageHandler(props)
}
