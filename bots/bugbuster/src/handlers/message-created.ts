import { BotLogger, RuntimeError } from '@botpress/sdk'
import { BotpressApi } from 'src/utils/botpress-utils'
import * as utils from '../utils'
import { listIssues, runLints } from './issue-processor'
import { addTeam, listTeams, removeTeam } from './teams-manager'
import * as bp from '.botpress'

const MESSAGING_INTEGRATIONS = ['telegram', 'slack']
const COMMAND_LIST_MESSAGE = `Unknown command. Here's a list of possible commands:
/addTeam [teamName]
/removeTeam [teamName]
/listTeams
/lintAll`
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

  const [command, teamKey] = message.payload.text.trim().split(' ')
  if (!command) {
    await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
  }

  const withErrorHandling = async <T>(promise: Promise<T>, action: string) => {
    try {
      return await promise
    } catch (thrown) {
      return _onError(thrown, botpress, logger, conversation.id, action)
    }
  }

  switch (command) {
    case '/addTeam': {
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      const linear = await withErrorHandling(utils.linear.LinearApi.create(), 'trying to add a team')
      const result = await withErrorHandling(addTeam(client, ctx.botId, teamKey, linear), 'trying to add a team')

      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '/removeTeam': {
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      const result = await withErrorHandling(removeTeam(client, ctx.botId, teamKey), 'trying to remove a team')
      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '/listTeams': {
      const result = await withErrorHandling(listTeams(client, ctx.botId), 'trying to list teams')
      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '/lintAll': {
      const teamsResult = await withErrorHandling(listTeams(client, ctx.botId), 'trying to lint all issues')
      if (!teamsResult.success || !teamsResult.result) {
        await botpress.respondText(conversation.id, teamsResult.message)
        return
      }

      const linear = await withErrorHandling(utils.linear.LinearApi.create(), 'trying to lint all issues')
      try {
        const issues = await listIssues(teamsResult.result, linear)
        await runLints(linear, issues, logger)
      } catch (thrown) {
        await _onError(thrown, botpress, logger, conversation.id, 'trying to lint all issues')
      }

      await botpress.respondText(conversation.id, 'Success: linted all issues.')
      break
    }
    default: {
      await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
      break
    }
  }
}

const _onError = async (
  thrown: unknown,
  botpress: BotpressApi,
  logger: BotLogger,
  conversationId: string,
  context: string
) => {
  const error = thrown instanceof Error ? thrown : new Error(String(thrown))
  const message = `An error occured while ${context}: ${error.message}`
  logger.error(message)
  await botpress.respondText(conversationId, message)
  throw new RuntimeError(error.message)
}
