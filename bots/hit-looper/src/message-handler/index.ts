import { Conversation } from '@botpress/client'
import { MessageHandler } from '../types'
import { agentMessageHandler } from './from-agent'
import { patientMessageHandler } from './from-patient'

type MessageSource = 'from_patient' | 'from_agent'
const getMessageSource = (conversation: Conversation): MessageSource => {
  if (conversation.integration === 'teams') {
    return 'from_patient'
  }
  if (conversation.integration === 'webchat') {
    return 'from_agent'
  }
  throw new Error(`Unknown integration ${conversation.integration}`)
}

export const messageHandler: MessageHandler = async (props) => {
  const source = getMessageSource(props.conversation)
  if (source === 'from_agent') {
    await agentMessageHandler(props)
    return
  }
  await patientMessageHandler(props)
}
