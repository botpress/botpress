import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { Messenger } from './messenger'

const onServerStarted = async (bp: typeof sdk) => {
  bp.logger.warn('Started!')

  const messenger = new Messenger(bp)
  messenger.initialize()
}

const onServerReady = (bp: typeof sdk) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onServerStarted,
  definition: {
    name: 'channel-messenger',
    fullName: 'Messenger Channel'
  }
}

export default entryPoint
