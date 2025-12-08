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

  if (commandDefinition.requiredArgs && args.length < commandDefinition.requiredArgs?.length) {
    await botpress.respondText(
      conversation.id,
      `Error: a minimum of ${commandDefinition.requiredArgs.length} argument(s) is required.`
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

const _buildListCommandsMessage = (definitions: CommandDefinition[]) => {
  const commands = definitions.map(_buildCommandMessage).join('\n')
  return `Unknown command. Here's a list of possible commands:\n${commands}`
}

const _buildCommandMessage = (definition: CommandDefinition) => {
  const requiredArgs = definition.requiredArgs?.map((arg) => `<${arg}>`).join(' ')
  const optionalArgs = definition.optionalArgs?.map((arg) => `[${arg}]`).join(' ')

  return `${definition.name} ${requiredArgs ?? ''} ${optionalArgs ?? ''}`
}
