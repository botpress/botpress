import { handleError } from 'src/utils/error-handler'
import * as utils from '../utils'
import { addTeam, listTeams, removeTeam } from './teams-manager'
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
  const { conversation, message, client, ctx, logger } = props
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

  const [command, param] = message.payload.text.trim().split(' ')
  if (!command) {
    await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
    return
  }

  const _handleError = (context: string) => handleError(context, logger, botpress, conversation.id)

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
      if (!param) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      const linear = await utils.linear.LinearApi.create().catch(_handleError('trying to add a team'))
      const result = await addTeam(client, ctx.botId, param, linear).catch(_handleError('trying to add a team'))

      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '#removeTeam': {
      if (!param) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      const result = await removeTeam(client, ctx.botId, param).catch(_handleError('trying to remove a team'))
      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '#listTeams': {
      const result = await listTeams(client, ctx.botId).catch(_handleError('trying to list teams'))
      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '#lintAll': {
      const workflows = await props.client.listWorkflows({
        name: 'lintAll',
        statuses: ['in_progress', 'listening', 'pending'],
      })

      if (workflows.workflows.length > 0) {
        await botpress.respondText(conversation.id, "Error: a 'lintAll' workflow is already in progress.")
        return
      }

      await props.workflows.lintAll.startNewInstance({ input: { conversationId: conversation.id } })
      await botpress.respondText(conversation.id, "Launched 'lintAll' workflow.")
      break
    }
    case '#setNotifChannel': {
      if (!param) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }

      await props.client.setState({
        id: ctx.botId,
        name: 'notificationChannelName',
        type: 'bot',
        payload: { name: param },
      })
      await botpress.respondText(conversation.id, `Success. Notification channel is now set to ${param}.`)
      break
    }
    case '#getNotifChannel': {
      const {
        state: {
          payload: { name },
        },
      } = await props.client.getOrSetState({
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
