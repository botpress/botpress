import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { ViberService } from './viber'

let service: ViberService

const onServerReady = async (bp: typeof sdk) => {
  service = new ViberService(bp)
  try {
    await service.initialize()
  } catch (err) {
    bp.logger.attachError(err).warn('Channel misconfigured')
  }
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  await service.mountBot(botId)
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  await service.unmountBot(botId)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  // bp.events.removeMiddleware('messenger.sendMessages')
  bp.http.deleteRouterForBot('channel-viber')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'channel-viber',
    noInterface: true,
    fullName: 'Viber Channel'
  }
}

export default entryPoint
