import * as hooks from './hooks'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.beforeIncomingMessage('*', async (props) => {
  return await hooks.beforeIncomingMessage.anyType.handleMessage(props)
})

export default plugin
