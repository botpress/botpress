import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Config } from '../config'

import { getDataset } from './dataset'
import { createZip, restoreAgent } from './engines/dialogflow'
import { enableForBot, registerMiddleware, removeForBot } from './middleware'

const dfListenerByBot: any = {}

const onServerStarted = async (bp: typeof sdk) => {
  await registerMiddleware(bp)
}

const onServerReady = async (bp: typeof sdk) => {}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const moduleBotConfig = (await bp.config.getModuleConfigForBot('nlu-extras', botId)) as Config

  if (!moduleBotConfig.dialogflow || !moduleBotConfig.dialogflow.enabled) {
    removeForBot(botId)
    return
  }

  enableForBot(botId, moduleBotConfig)

  const trainForBot = _.debounce(
    async () => {
      const bpfs = bp.ghost.forBot(botId)
      const dataset = await getDataset(bpfs)
      const zip = await createZip(dataset, moduleBotConfig.dialogflow)
      await restoreAgent(zip, moduleBotConfig.dialogflow)
      bp.logger.forBot(botId).info('Started DialogFlow training')
    },
    5000,
    { maxWait: 30000 }
  )

  const regex = RegExp(`^data/bots/${botId}/(intents|entities)/`, 'i')
  const listen = bp.ghost.forBot(botId).onFileChanged(async file => {
    if (regex.test(file)) {
      await trainForBot()
    }
  })

  dfListenerByBot[botId] = listen
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  try {
    removeForBot(botId)
    if (dfListenerByBot[botId]) {
      dfListenerByBot[botId].remove()
    }
  } catch {}
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('nlu.incoming')
  bp.http.deleteRouterForBot('nlu')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'nlu-extras',
    noInterface: true,
    moduleView: {
      stretched: true
    },
    menuIcon: 'translate',
    menuText: 'NLU Extras',
    fullName: 'NLU Extras',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
