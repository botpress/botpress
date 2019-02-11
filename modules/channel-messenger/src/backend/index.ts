import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import api from './api'

const onServerStarted = async (bp: typeof sdk) => {
  bp.logger.warn('Started!')

  await api(bp)
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
