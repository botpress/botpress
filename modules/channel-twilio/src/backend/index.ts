import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

import { TwilioService } from './twilio'

let service: TwilioService

const onServerStarted = async (bp: typeof sdk) => {
  service = new TwilioService(bp)
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
  bp.events.removeMiddleware('twilio.sendMessages')
  bp.http.deleteRouterForBot('channel-twilio')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  translations: { en, fr },
  definition: {
    name: 'channel-twilio',
    noInterface: true,
    fullName: 'Twilio Channel'
  }
}

export default entryPoint
