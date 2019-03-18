import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { MessengerService } from './messenger'

let service: MessengerService

const onServerStarted = async (bp: typeof sdk) => {
  service = new MessengerService(bp)
  try {
    await service.initialize()
  } catch (err) {
    bp.logger.attachError(err).warn('Channel misconfigured')
  }
}

const onServerReady = (bp: typeof sdk) => {}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  await service.mountBot(botId)
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  await service.unmountBot(botId)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onServerStarted,
  onBotMount: onBotMount,
  onBotUnmount: onBotUnmount,
  definition: {
    name: 'channel-messenger',
    noInterface: true,
    fullName: 'Messenger Channel'
  }
}

export default entryPoint
