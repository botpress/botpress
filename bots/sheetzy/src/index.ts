import { bot } from './bot'
import { CommandError, commands } from './commands'
import { ApiUtils } from './utils'

bot.message(async (props) => {
  const utils = new ApiUtils(props)

  if (props.message.type !== 'text') {
    await utils.respond('I only understand text messages')
    return
  }

  const text = props.message.payload.text as string
  const [command, ...args] = text.split(' ')
  if (!command) {
    await utils.respond('Please provide a command')
    await commands['/help'](props, [])
    return
  }

  const commandHandler = commands[command as keyof typeof commands]
  if (!commandHandler) {
    await utils.respond('Unknown command')
    await commands['/help'](props, [])
    return
  }

  try {
    await commandHandler(props, args)
  } catch (error) {
    if (error instanceof CommandError) {
      await utils.respond(error.message)
    } else {
      throw error
    }
  }
})

export default bot
