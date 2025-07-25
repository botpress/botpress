import * as utils from '../utils'
import * as bp from '.botpress'

const MESSAGING_INTEGRATIONS = ['telegram', 'slack']

export const handleMessageCreated: bp.MessageHandlers['*'] = async (props) => {
  const { conversation, message } = props
  if (!MESSAGING_INTEGRATIONS.includes(conversation.integration)) {
    props.logger.info(`Ignoring message from ${conversation.integration}`)
    return
  }
  const botpress = await utils.botpress.BotpressApi.create(props)
  await botpress.respondText(message.conversationId, "Hey, I'm BugBuster.")
}
