import { CommandDefinition } from 'src/types'
import * as boot from '../bootstrap'
import * as bp from '.botpress'

const MESSAGING_INTEGRATIONS = ['telegram', 'slack']

export const handleMessageCreated: bp.MessageHandlers['*'] = async (props) => {
  const { conversation, message } = props
  if (!MESSAGING_INTEGRATIONS.includes(conversation.integration)) {
    props.logger.info(`Ignoring message from ${conversation.integration}`)
    return
  }
  if (
    conversation.integration === 'slack' &&
    (conversation.channel === 'channel' || conversation.channel === 'thread')
  ) {
    return
  }

  const { botpress, commandProcessor } = boot.bootstrap(props)
  const commandListMessage = _buildListCommandsMessage(commandProcessor.commandDefinitions)

  if (message.type !== 'text') {
    await botpress.respondText(conversation.id, commandListMessage)
    return
  }

  if (!message.payload.text) {
    await botpress.respondText(conversation.id, commandListMessage)
    return
  }

  const [command, ...args] = message.payload.text.trim().split(' ')
  if (!command) {
    await botpress.respondText(conversation.id, commandListMessage)
    return
  }

  const commandDefinition = commandProcessor.commandDefinitions.find((commandImpl) => commandImpl.name === command)
  if (!commandDefinition) {
    await botpress.respondText(conversation.id, commandListMessage)
    return
  }

  if (args.length < commandDefinition.requiredArgsCount) {
    await botpress.respondText(
      conversation.id,
      `Error: a minimum of ${commandDefinition.requiredArgsCount} argument(s) is required.`
    )
    return
  }

  const _handleError = (context: string, thrown: unknown) =>
    botpress.handleError({ context, conversationId: conversation.id }, thrown)

  try {
    const result = await commandDefinition.implementation(args, conversation.id)
    await botpress.respondText(conversation.id, `${result.success ? '' : 'Error: '}${result.message}`)
  } catch (thrown) {
    await _handleError(`trying to run ${commandDefinition.name}`, thrown)
  }
}

const _buildNotifChannelsMessage = (channels: { name: string; teams: string[] }[]) => {
  return `The Slack notification channels are:\n${channels.map(_getMessageForChannel).join('\n')}`
}

const _getMessageForChannel = (channel: { name: string; teams: string[] }) => {
  const { name, teams } = channel
  return `- channel ${name} for team(s) ${teams.join(', ')}`
}

const _buildListCommandsMessage = (definitions: CommandDefinition[]) => {
  const commands = definitions.map((def) => `${def.name} ${def.argNames ?? ''}`).join('\n')
  return `Unknown command. Here's a list of possible commands:\n${commands}`
}
