import * as utils from '../utils'
import { addTeam, listAllTeams, listWatchedTeams, removeTeam, Result } from './teams-manager'
import * as bp from '.botpress'

const MESSAGING_INTEGRATIONS = ['telegram', 'slack']
const COMMAND_LIST_MESSAGE = `Hey, I\m BugBuster. Here's a list of possible commands:
/add-team [teamName]
/remove-team [teamName]
/list-all-teams
/list-watched-teams
`
const ARGUMENT_REQUIRED_MESSAGE = 'Error: an argument is required with this command.'

export const handleMessageCreated: bp.MessageHandlers['*'] = async (props) => {
  const { conversation, message, client, ctx } = props
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

  let result: Result
  let linear: utils.linear.LinearApi

  switch (command) {
    case '/add-team':
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      linear = await utils.linear.LinearApi.create()
      result = await addTeam(client, ctx.botId, teamKey, linear)
      await botpress.respondText(conversation.id, result.message)
      break
    case '/remove-team':
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      result = await removeTeam(client, ctx.botId, teamKey)
      await botpress.respondText(conversation.id, result.message)
      break
    case '/list-all-teams':
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      linear = await utils.linear.LinearApi.create()
      result = await listAllTeams(client, ctx.botId, linear)
      await botpress.respondText(conversation.id, result.message)
      break
    case '/list-watched-teams':
      linear = await utils.linear.LinearApi.create()
      result = await listWatchedTeams(client, ctx.botId)
      await botpress.respondText(conversation.id, result.message)
      break
    default:
      await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
      break
  }
}
