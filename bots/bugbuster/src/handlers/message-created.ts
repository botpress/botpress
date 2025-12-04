import * as boot from '../bootstrap'
import * as bp from '.botpress'

const MESSAGING_INTEGRATIONS = ['telegram', 'slack']
const COMMAND_LIST_MESSAGE = `Unknown command. Here's a list of possible commands:
#health
#addTeam [teamName]
#removeTeam [teamName]
#listTeams
#lintAll
#getNotifChannel
#setNotifChannel [channelName]`
const ARGUMENT_REQUIRED_MESSAGE = 'Error: an argument is required with this command.'

export const handleMessageCreated: bp.MessageHandlers['*'] = async (props) => {
  const { conversation, message, client, ctx } = props
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

  const { botpress, teamsManager } = boot.bootstrap(props)

  if (message.type !== 'text') {
    await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
    return
  }

  if (!message.payload.text) {
    await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
    return
  }

  const [command, arg1] = message.payload.text.trim().split(' ')
  if (!command) {
    await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
    return
  }

  const _handleError = (context: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId: conversation.id }, thrown)

  switch (command) {
    case '#addTeam': {
      if (!arg1) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }

      await teamsManager.addWatchedTeam(arg1).catch(_handleError('trying to add a team'))

      await botpress.respondText(
        conversation.id,
        `Success: the team with the key '${arg1}' has been added to the watched team list.`
      )
      break
    }
    case '#removeTeam': {
      if (!arg1) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }

      await teamsManager.removeWatchedTeam(arg1).catch(_handleError('trying to remove a team'))
      await botpress.respondText(
        conversation.id,
        `Success: the team with the key '${arg1}' has been removed from the watched team list.`
      )
      break
    }
    case '#listTeams': {
      const teams = await teamsManager.listWatchedTeams().catch(_handleError('trying to list teams'))
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
    case '#setNotifChannel': {
      if (!arg1) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      await client.setState({
        id: ctx.botId,
        name: 'notificationChannelName',
        type: 'bot',
        payload: { name: arg1 },
      })
      await botpress.respondText(conversation.id, `Success. Notification channel is now set to ${arg1}.`)
      break
    }
    case '#getNotifChannel': {
      const {
        state: {
          payload: { name },
        },
      } = await client.getOrSetState({
        id: ctx.botId,
        name: 'notificationChannelName',
        type: 'bot',
        payload: {},
      })
      let message = 'There is no set Slack notification channel.'
      if (name) {
        message = `The Slack notification channel is ${name}.`
      }
      await botpress.respondText(conversation.id, message)
      break
    }
    default: {
      await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
      break
    }
  }
}
