import * as utils from '../utils'
import * as bp from '.botpress'
import { bootstrap } from 'src/bootstrap'

const MESSAGING_INTEGRATIONS = ['telegram', 'slack']
const COMMAND_LIST_MESSAGE = `Unknown command. Here's a list of possible commands:
#health
#addTeam [teamName]
#removeTeam [teamName]
#listTeams
#lintAll`
const ARGUMENT_REQUIRED_MESSAGE = 'Error: an argument is required with this command.'

export const handleMessageCreated: bp.MessageHandlers['*'] = async (props) => {
  const { conversation, message, client } = props
  if (!MESSAGING_INTEGRATIONS.includes(conversation.integration)) {
    props.logger.info(`Ignoring message from ${conversation.integration}`)
    return
  }

  const botpress = await utils.botpress.BotpressApi.create(props)

  if (message.type !== 'text') {
    await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
    return
  }

  if (!message.payload.text) {
    await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
    return
  }

  const [command, teamKey] = message.payload.text.trim().split(' ')
  if (!command) {
    await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
    return
  }

  const _handleError = (context: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId: conversation.id }, thrown)

  switch (command) {
    case '#health': {
      let isLinearHealthy = true
      try {
        await utils.linear.LinearApi.create()
      } catch {
        isLinearHealthy = false
      }

      await botpress.respondText(conversation.id, `Linear: ${isLinearHealthy ? '' : 'un'}healthy`)
      break
    }
    case '#addTeam': {
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      const { teamsManager } = await bootstrap(props, conversation.id)
      await teamsManager.addTeam(teamKey).catch(_handleError('trying to add a team'))

      await botpress.respondText(
        conversation.id,
        `Success: the team with the key '${teamKey}' has been added to the watched team list.`
      )
      break
    }
    case '#removeTeam': {
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      const { teamsManager } = await bootstrap(props, conversation.id)
      await teamsManager.removeTeam(teamKey).catch(_handleError('trying to remove a team'))
      await botpress.respondText(
        conversation.id,
        `Success: the team with the key '${teamKey}' has been removed from the watched team list.`
      )
      break
    }
    case '#listTeams': {
      const { teamsManager } = await bootstrap(props, conversation.id)
      const teams = await teamsManager.listTeams().catch(_handleError('trying to list teams'))
      await botpress.respondText(conversation.id, teams.join(', '))
      break
    }
    case '#lintAll': {
      await client.getOrCreateWorkflow({
        name: 'lintAll',
        input: {},
        discriminateByStatusGroup: 'active',
        conversationId: conversation.id,
        status: 'pending',
      })

      await botpress.respondText(conversation.id, "Launched 'lintAll' workflow.")
      break
    }
    default: {
      await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
      break
    }
  }
}
