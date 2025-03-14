import * as actions from './actions'
import * as hooks from './hooks'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    async syncFilesToBotpess(props) {
      props.logger.info('Called action syncFilesToBotpess')
      return await actions.syncFilesToBotpess.callAction(props)
    },
  },
})

plugin.on.event('scheduledSync', async (props) => {
  props.logger.info('Scheduled sync event received', props.event.payload)
  return await hooks.onEvent.scheduledSync.handleEvent(props)
})

export default plugin
