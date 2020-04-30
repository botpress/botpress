import { EditableFile } from '../../../backend/typings'
import { HOOK_SIGNATURES } from '../../../typings/hooks'

const START_COMMENT = `/** Your code starts below */`
const END_COMMENT = '/** Your code ends here */'

const ACTION_HTTP_SIGNATURE =
  'function action(event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state)'

const ACTION_LEGACY_SIGNATURE =
  'function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state)'

const wrapper = {
  add: (file: EditableFile, content: string) => {
    const { type, hookType, botId } = file

    if (type === 'action_legacy') {
      return `${ACTION_LEGACY_SIGNATURE} {\n  ${START_COMMENT}\n\n${content}\n\n  ${END_COMMENT}\n}`
    } else if (type === 'action_http') {
      return `${ACTION_HTTP_SIGNATURE} {\n  ${START_COMMENT}\n\n${content}\n\n  ${END_COMMENT}\n}`
    } else if (type === 'hook' && HOOK_SIGNATURES[hookType]) {
      let signature = HOOK_SIGNATURES[hookType]
      if (signature.includes('\n')) {
        signature = `${signature.substring(0, signature.length - 1)}\n)`
      }
      return `${signature} {\n  ${START_COMMENT}\n\n${content}\n\n  ${END_COMMENT}\n}`
    } else if (type === 'bot_config') {
      return content.replace('../../bot.config.schema.json', 'bp://types/bot.config.schema.json')
    } else if (type === 'main_config') {
      return content.replace('../botpress.config.schema.json', 'bp://types/botpress.config.schema.json')
    } else if (type === 'module_config') {
      return content.replace(/"..\/..\/assets\/(.*?config\.schema\.json")/, '"bp://types/$1')
    } else {
      return content
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
      return content.replace(/"bp:\/\/types\/(.*?config\.schema\.json")/, '"../../assets/$1')
    }

    const startIndex = content.indexOf(START_COMMENT)
    const endIndex = content.indexOf(END_COMMENT)

    if (startIndex === -1 || endIndex === -1) {
      return content
    }

    const emptyLineAtBeginning = /^\s+?\n/
    const emptyLineAtEnd = /\s+?\n?$/
    return content
      .substring(startIndex + START_COMMENT.length, endIndex)
      .replace(emptyLineAtBeginning, '')
      .replace(emptyLineAtBeginning, '')
      .replace(emptyLineAtEnd, '')
  }
}

export { wrapper }
