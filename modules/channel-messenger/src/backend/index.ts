import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { MessengerService } from './messenger'

const onServerStarted = async (bp: typeof sdk) => {
  const messengerService = new MessengerService(bp)
  messengerService.initialize()
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
