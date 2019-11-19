import { HOOK_SIGNATURES } from '../../../typings/hooks'

const START_COMMENT = `/** Your code starts below */`
const END_COMMENT = '/** Your code ends here */'

const ACTION_SIGNATURE =
  'async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state)'

const wrapper = {
  add: (content: string, type: string, hookType?: string) => {
    if (type === 'action') {
      return `${ACTION_SIGNATURE}{\n${START_COMMENT}\n\n${content}\n${END_COMMENT}\n}`
    } else if (type === 'hook' && HOOK_SIGNATURES[hookType]) {
      return `${HOOK_SIGNATURES[hookType]}{\n${START_COMMENT}\n\n${content}\n${END_COMMENT}\n}`
    } else if (type === 'bot_config') {
      return content.replace('../../bot.config.schema.json', 'bp://types/bot.config.schema.json')
    } else if (type === 'main_config') {
      return content.replace('../botpress.config.schema.json', 'bp://types/botpress.config.schema.json')
    } else if (type === 'module_config') {
      return content // TODO: download schemas from server
    } else {
      return `// Unknown file type`
    }
  },
  remove: (content: string, type: string) => {
    if (type === 'bot_config') {
      return content.replace('bp://types/bot.config.schema.json', '../../bot.config.schema.json')
    }
    if (type === 'main_config') {
      return content.replace('bp://types/botpress.config.schema.json', '../botpress.config.schema.json')
    }
    if (type === 'module_config') {
      return content
    }

    const startIndex = content.indexOf(START_COMMENT)
    const endIndex = content.indexOf(END_COMMENT)

    if (startIndex === -1 || endIndex === -1) {
      return content
    }

    return content.substring(startIndex + START_COMMENT.length, endIndex).trim()
  }
}

export { wrapper }
