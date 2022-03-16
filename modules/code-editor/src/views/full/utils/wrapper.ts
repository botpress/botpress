import path from 'path'

import { EditableFile } from '../../../backend/typings'
import { HOOK_SIGNATURES } from '../../../typings/hooks'

const START_COMMENT = '/** Your code starts below */'
const END_COMMENT = '/** Your code ends here */'

const ACTION_HTTP_SIGNATURE =
  'function action(event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state)'

const ACTION_LEGACY_SIGNATURE =
  'function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state)'

const wrapper = {
  add: (file: EditableFile, content: string) => {
    const { type, hookType, name } = file
    const isJs = path.extname(name) === '.js'

    if (type === 'action_legacy' && isJs) {
      return `${ACTION_LEGACY_SIGNATURE} {\n  ${START_COMMENT}\n\n${content}\n\n  ${END_COMMENT}\n}`
    } else if (type === 'action_http' && isJs) {
      return `${ACTION_HTTP_SIGNATURE} {\n  ${START_COMMENT}\n\n${content}\n\n  ${END_COMMENT}\n}`
    } else if (type === 'hook' && HOOK_SIGNATURES[hookType] && isJs) {
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
  },
  beginning: (content: string) => {
    const lines = content.split('\n')
    const startIndex = lines.findIndex(line => line.includes(START_COMMENT))

    if (startIndex === -1) {
      return 0
    } else {
      return startIndex + 2
    }
  },
  end: (content: string) => {
    const lines = content.split('\n')
    const endIndex = lines.findIndex(line => line.includes(END_COMMENT))

    if (endIndex === -1) {
      return lines.length + 1
    } else {
      return endIndex + 2
    }
  }
}

const findLastIndex = <T>(array: T[], predicate: (value: T, index: number, array: T[]) => boolean): number => {
  let i = array.length
  while (i--) {
    if (predicate(array[i], i, array)) {
      return i
    }
  }
  return -1
}

const getContentZone = (lines: string[]) => {
  let startLine = lines.findIndex(x => x.includes(START_COMMENT))
  if (startLine !== -1) {
    startLine += 2
  }

  let endLine = findLastIndex(lines, x => x.includes(END_COMMENT))
  const noContent = startLine > endLine

  // Fix for files which doesn't have wrappers
  if (endLine === -1) {
    endLine = lines.length
  }

  return { startLine, endLine, noContent }
}

export { wrapper, getContentZone }
