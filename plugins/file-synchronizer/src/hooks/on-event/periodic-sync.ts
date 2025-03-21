import * as pluginActions from '../../actions'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['periodicSync'] = async (props) => {
  await pluginActions.syncFilesToBotpess.callAction({ ...props, input: {} })
}
