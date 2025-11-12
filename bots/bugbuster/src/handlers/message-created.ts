import * as utils from '../utils'
import { findIssues, runLints } from './issue-processor'
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

  switch (command) {
    case '/addTeam': {
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      const linear = await utils.linear.LinearApi.create()
      const result = await addTeam(client, ctx.botId, teamKey, linear)
      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '/removeTeam': {
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      const result = await removeTeam(client, ctx.botId, teamKey)
      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '/listTeams': {
      const result = await listTeams(client, ctx.botId)
      await botpress.respondText(conversation.id, result.message)
      break
    }
    case '/lintAll': {
      const teamsResult = await listTeams(client, ctx.botId)
      if (!teamsResult.success || !teamsResult.result) {
        await botpress.respondText(conversation.id, teamsResult.message)
        return
      }
      const linear = await utils.linear.LinearApi.create()
      const issues = await findIssues(teamsResult.result, linear)
      await runLints(linear, issues, logger)
      await botpress.respondText(conversation.id, 'Success: linted all issues.')
      break
    }
    default: {
      await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
      break
    }
  }
}
