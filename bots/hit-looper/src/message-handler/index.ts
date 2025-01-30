import { Conversation } from '@botpress/client'
import { agentMessageHandler } from './from-agent'
import { patientMessageHandler } from './from-patient'
import { MessageHandlers } from '.botpress'
import * as bp from '.botpress'

type MessageSource = 'from_patient' | 'from_agent'
const getMessageSource = (conversation: Conversation): MessageSource => {
  if (conversation.integration === 'zendesk') {
    return 'from_agent'
  }
  return 'from_patient'
}

export const messageHandler =
  (bot: bp.Bot): MessageHandlers['*'] =>
  async (props) => {
    const source = getMessageSource(props.conversation)
    if (source === 'from_agent') {
      await agentMessageHandler(bot)(props)
      return
    }
    await patientMessageHandler(bot)(props)
  }
