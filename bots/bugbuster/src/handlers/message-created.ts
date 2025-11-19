import { RuntimeError } from '@botpress/sdk'
import * as utils from '../utils'
import { listIssues, runLints } from './issue-processor'
import { addTeam, listTeams, removeTeam } from './teams-manager'
import * as bp from '.botpress'

const MESSAGING_INTEGRATIONS = ['telegram', 'slack']
const COMMAND_LIST_MESSAGE = `Unknown command. Here's a list of possible commands:
#health
#addTeam [teamName]
#removeTeam [teamName]
#listTeams
#lintAll`
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

  const [command, teamKey] = message.payload.text.trim().split(' ')
  if (!command) {
    await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
    return
  }

  const _handleError = (context: string) => async (thrown: unknown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    const message = `An error occured while ${context}: ${error.message}`
    logger.error(message)
    await botpress.respondText(conversation.id, message)
    throw new RuntimeError(error.message)
  }

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
      const linear = await utils.linear.LinearApi.create().catch(_handleError('trying to add a team'))
      const result = await addTeam(client, ctx.botId, teamKey, linear).catch(_handleError('trying to add a team'))

      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '#removeTeam': {
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      const result = await removeTeam(client, ctx.botId, teamKey).catch(_handleError('trying to remove a team'))
      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '#listTeams': {
      const result = await listTeams(client, ctx.botId).catch(_handleError('trying to list teams'))
      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '#lintAll': {
      const teamsResult = await listTeams(client, ctx.botId).catch(_handleError('trying to lint all issues'))
      if (!teamsResult.success || !teamsResult.result) {
        await botpress.respondText(conversation.id, teamsResult.message)
        return
      }

      const linear = await utils.linear.LinearApi.create().catch(_handleError('trying to lint all issues'))
      const issues = await listIssues(teamsResult.result, linear).catch(_handleError('trying to list all issues'))
      await runLints(linear, issues, logger).catch(_handleError('trying to run lints on all issues'))

      await botpress.respondText(conversation.id, 'Success: linted all issues.')
      break
    }
    default: {
      await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
      break
    }
  }
}
