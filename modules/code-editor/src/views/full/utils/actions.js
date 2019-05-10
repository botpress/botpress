const action = {
  startBlock: `async function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
/** Your action code starts below */

`,
  endBlock: `
/** Your action code ends here */ 
}
`
}

const wrapper = {
  add: content => `${action.startBlock}${content}${action.endBlock}`,
  remove: content => content.replace(action.startBlock, '').replace(action.endBlock, '')
}

export { wrapper }
