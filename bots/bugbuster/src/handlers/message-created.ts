import * as utils from '../utils'
import { addTeam, listAllTeams, listWatchedTeams, removeTeam, Result } from './teams-manager'
import * as bp from '.botpress'

const MESSAGING_INTEGRATIONS = ['telegram', 'slack']
const COMMAND_LIST_MESSAGE = `Unknown command. Here's a list of possible commands:
/addTeam [teamName]
/removeTeam [teamName]
/listAllTeams
/listWatchedTeams
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
    case '/addTeam':
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      linear = await utils.linear.LinearApi.create()
      result = await addTeam(client, ctx.botId, teamKey, linear)
      await botpress.respondText(conversation.id, result.message)
      break
    case '/removeTeam':
      if (!teamKey) {
        await botpress.respondText(conversation.id, ARGUMENT_REQUIRED_MESSAGE)
        return
      }
      result = await removeTeam(client, ctx.botId, teamKey)
      await botpress.respondText(conversation.id, result.message)
      break
    case '/listAllTeams':
      linear = await utils.linear.LinearApi.create()
      result = await listAllTeams(linear)
      await botpress.respondText(conversation.id, result.message)
      break
    case '/listWatchedTeams':
      linear = await utils.linear.LinearApi.create()
      result = await listWatchedTeams(client, ctx.botId)
      await botpress.respondText(conversation.id, result.message)
      break
    default:
      await botpress.respondText(conversation.id, COMMAND_LIST_MESSAGE)
      break
  }
}
