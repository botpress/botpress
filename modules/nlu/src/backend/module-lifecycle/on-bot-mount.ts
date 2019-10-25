import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import yn from 'yn'

import { Config } from '../../config'
import ConfusionEngine from '../confusion-engine'
import Engine2 from '../engine2/engine2'
import * as ModelService from '../engine2/model-service'
import { NLUState } from '../index'

const USE_E1 = yn(process.env.USE_LEGACY_NLU)

export function getOnBotMount(state: NLUState) {
  return async (bp: typeof sdk, botId: string) => {
    const moduleBotConfig = (await bp.config.getModuleConfigForBot('nlu', botId)) as Config
    const bot = await bp.bots.getBotById(botId)

    const languages = _.intersection(bot.languages, state.languageProvider.languages)
    if (bot.languages.length !== languages.length) {
      const diff = _.difference(bot.languages, languages)
      bp.logger.warn(
        `Bot ${
          bot.id
        } has configured languages that are not supported by language sources. Configure a before incoming hook to call an external NLU provider for those languages.`,
        { notSupported: diff }
      )
    }

    const scoped = new ConfusionEngine(
      bp.logger,
      botId,
      moduleBotConfig,
      bp.MLToolkit,
      languages,
      bot.defaultLanguage,
      state.languageProvider,
      bp.realtime,
      bp.RealTimePayload
    )

    state.nluByBot[botId] = scoped
    if (USE_E1) {
      await scoped.init()
      return
    }

    const e2 = new Engine2(bot.defaultLanguage, bp.logger.forBot(botId))
    const ghost = bp.ghost.forBot(botId)

    const trainOrLoad = _.debounce(
      async () => {
        const intentDefs = await scoped.storage.getIntents() // todo replace this with intent service when implemented
        const entityDefs = await scoped.storage.getCustomEntities() // TODO: replace this wit entities service once implemented
        const hash = ModelService.computeModelHash(intentDefs, entityDefs)

        await Promise.mapSeries(languages, async languageCode => {
          const model = await ModelService.getModel(ghost, hash, languageCode)
          if (model) {
            await e2.loadModel(model)
          } else {
            const trainLock = await bp.distributed.acquireLock(`train:${botId}:${languageCode}`, ms('5m'))
            if (!trainLock) {
              return
            }

            const model = await e2.train(intentDefs, entityDefs, languageCode)
            await trainLock.unlock()

            if (model.success) {
              await ModelService.saveModel(ghost, model, hash)
              await state.broadcastLoadModel(botId, hash, languageCode)
            }
          }
        })
      },
      4000,
      { leading: true }
    )

    state.e2ByBot[botId] = e2
    // register trainOrLoad with ghost file watcher
    // we use local events so training occures on the same node where the request for changes enters
    state.watchersByBot[botId] = bp.ghost.forBot(botId).onFileChanged(async f => {
      if (f.includes('intents') || f.includes('entities')) {
        await trainOrLoad()
      }
    })
    trainOrLoad() // floating promise on purpose
  }
}
