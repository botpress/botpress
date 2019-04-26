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

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('messenger.sendMessages')
  bp.http.deleteRouterForBot('channel-messenger')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onServerStarted,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'channel-messenger',
    noInterface: true,
    fullName: 'Messenger Channel'
  }
}

export default entryPoint
