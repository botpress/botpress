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
    } else {
      return `// Unknown file type`
    }
  },
  remove: content => {
    const contentStart = content.indexOf(START_COMMENT) + START_COMMENT.length
    const contentEnd = content.indexOf(END_COMMENT)

    return content.substring(contentStart, contentEnd).trim()
  }
}

export { wrapper }
