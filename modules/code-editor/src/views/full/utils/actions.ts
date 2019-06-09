const ACTION_SIGNATURE =
  'async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state)'
const ACTION_START_COMMENT = `/** Your action code starts below */`
const ACTION_END_COMMENT = '/** Your action code ends here */'

const wrapper = {
  add: content => `${ACTION_SIGNATURE}{\n${ACTION_START_COMMENT}\n\n${content}\n${ACTION_END_COMMENT}\n}`,
  remove: content => {
    const contentStart = content.indexOf(ACTION_START_COMMENT) + ACTION_START_COMMENT.length
    const contentEnd = content.indexOf(ACTION_END_COMMENT)

    return content.substring(contentStart, contentEnd).trim()
  }
}

export { wrapper }
