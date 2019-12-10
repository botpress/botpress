import * as sdk from 'botpress/sdk'
import { validate } from 'joi'
import _ from 'lodash'
import ms from 'ms'
import seedrandom from 'seedrandom'
import yn from 'yn'

import ConfusionEngine from './confusion-engine'
import ScopedEngine from './engine'
import E2 from './engine2/engine2'
import { getTrainingSession } from './engine2/train-session-service'
import { EntityDefCreateSchema } from './entities'
import { initializeLanguageProvider } from './module-lifecycle/on-server-started'
import MultiClassF1Scorer, { Scorer } from './tools/f1-scorer'
import { parseUtterance } from './tools/utterance-parser'
import { NLUState } from './typings'
import { IntentDefCreateSchema } from './validation'

const SYNC_INTERVAL_MS = ms('5s')
const USE_E1 = yn(process.env.USE_LEGACY_NLU)

export default async (bp: typeof sdk, state: NLUState) => {
  const router = bp.http.createRouterForBot('nlu')

  const syncByBots: { [key: string]: NodeJS.Timer } = {}

  const scheduleSyncNLU = (botId: string) => {
    if (!USE_E1) {
      return
    }
    if (syncByBots[botId]) {
      clearTimeout(syncByBots[botId])
      delete syncByBots[botId]
    }

    syncByBots[botId] = setTimeout(() => {
      delete syncByBots[botId]
      const botEngine = state.nluByBot[botId].engine1 as ScopedEngine
      syncNLU(botEngine, false)
    }, SYNC_INTERVAL_MS)
  }

  const syncNLU = async (
    botEngine: ScopedEngine,
    confusionMode: boolean = false,
    confusionVersion: string = undefined
  ): Promise<string> => {
    if (confusionMode && botEngine instanceof ConfusionEngine) {
      botEngine.computeConfusionOnTrain = true
    }

    try {
      return await botEngine.trainOrLoad(confusionMode, confusionVersion)
    } catch (e) {
      bp.realtime.sendPayload(
        bp.RealTimePayload.forAdmins('toast.nlu-sync', {
          text: `NLU Sync Error: ${e.name} : ${e.message}`,
          type: 'error'
        })
      )
    } finally {
      if (confusionMode && botEngine instanceof ConfusionEngine) {
        botEngine.computeConfusionOnTrain = false
      }
    }
  }

  router.get('/health', async (req, res) => {
    // When the health is bad, we'll refresh the status in case it changed (eg: user added languages)
    if (!state.health.isEnabled) {
      await initializeLanguageProvider(bp, state)
    }
    res.send(state.health)
  })

  router.get('/currentModelHash', async (req, res) => {
    const engine = state.nluByBot[req.params.botId].engine1 as ScopedEngine
    if (engine.modelHash) {
      return res.send(engine.modelHash)
    }

    const intents = await engine.storage.getIntents()
    const entities = await engine.storage.getCustomEntities()
    const modelHash = engine.computeModelHash(intents, entities)
    res.send(modelHash)
  })

  router.get('/confusion/:modelHash/:version', async (req, res) => {
    const engine = state.nluByBot[req.params.botId].engine1 as ConfusionEngine
    const confusionComputing = engine.confusionComputing
    const lang = req.query.lang || (await sdk.bots.getBotById(req.params.botId)).defaultLanguage

    try {
      const matrix = await engine.storage.getConfusionMatrix(req.params.modelHash, req.params.version, lang)
      res.send({ matrix, confusionComputing })
    } catch (err) {
      bp.logger.attachError(err).warn(`Could not get confusion matrix for ${req.params.modelHash}.`)
      res.send({ confusionComputing })
    }
  })

  router.get('/confusion', async (req, res) => {
    try {
      const botId = req.params.botId
      const confusions = await (state.nluByBot[botId].engine1 as ScopedEngine).storage.getAllConfusionMatrix()
      res.send({ botId, confusions })
    } catch (err) {
      res.sendStatus(500)
    }
  })

  router.post('/confusion', async (req, res) => {
    const botEngine = state.nluByBot[req.params.botId].engine1 as ScopedEngine
    const intentDefs = await botEngine.storage.getIntents()
    const entityDefs = await botEngine.storage.getCustomEntities()

    // TODO move this part of code somewhere else
    const lang = 'en' // todo use req
    const trainSetSize = 0.8

    seedrandom('confusion', { global: true })
    const lo = _.runInContext()

    let testSet: { example: string; expected: string }[] = [] // TODO add ctx in test example
    const trainSet = intentDefs // split the data & preserve distribution
      .map(i => {
        const nTrain = Math.ceil(trainSetSize * i.utterances[lang].length)
        if (nTrain < 3) {
          return
        }

        const utterances = lo.shuffle(i.utterances[lang])
        const trainUtts = utterances.slice(0, nTrain)
        testSet = [
          ...testSet,
          ...utterances.slice(nTrain).map(u => ({ example: parseUtterance(u).utterance, expected: i.name }))
        ]

        return {
          ...i,
          utterances: { [lang]: trainUtts }
        }
      })
      .filter(Boolean)

    const F1Engine = new E2('en', req.botId, bp.logger)
    await F1Engine.train(trainSet, entityDefs, lang)

    const f1Scorer = new MultiClassF1Scorer()

    for (const { example, expected } of testSet) {
      const res = await F1Engine.predict(example, ['global'])
      f1Scorer.record(res.intent.name, expected)
    }

    // for intent only, we should do the same for ctx and for slots
    const results = f1Scorer.getResults()

    // TODO after all, reset seed using seedrandom()

    try {
      const botEngine = state.nluByBot[req.params.botId].engine1 as ScopedEngine
      const { version } = req.body
      const modelHash = await syncNLU(botEngine, true, version)
      res.send({ modelHash })
    } catch (err) {
      res.status(400).send('Could not train confusion matrix')
    }
  })

  router.get('/training/:language', async (req, res) => {
    const { language, botId } = req.params
    const session = await getTrainingSession(bp, botId, language)
    res.send(session)
  })

  router.get('/intents', async (req, res) => {
    res.send(await (state.nluByBot[req.params.botId].engine1 as ScopedEngine).storage.getIntents())
  })

  router.get('/intents/:intent', async (req, res) => {
    res.send(await (state.nluByBot[req.params.botId].engine1 as ScopedEngine).storage.getIntent(req.params.intent))
  })

  router.post('/intents/:intent/delete', async (req, res) => {
    const botEngine = state.nluByBot[req.params.botId].engine1 as ScopedEngine

    await botEngine.storage.deleteIntent(req.params.intent)
    scheduleSyncNLU(req.params.botId)

    res.sendStatus(204)
  })

  router.post('/intents', async (req, res) => {
    try {
      const intentDef = await validate(req.body, IntentDefCreateSchema, {
        stripUnknown: true
      })

      const botEngine = state.nluByBot[req.params.botId].engine1 as ScopedEngine
      await botEngine.storage.saveIntent(intentDef.name, intentDef)
      scheduleSyncNLU(req.params.botId)

      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).warn('Cannot create intent, invalid schema')
      res.status(400).send('Invalid schema')
    }
  })

  router.get('/contexts', async (req, res) => {
    const botId = req.params.botId
    const intents = await (state.nluByBot[botId].engine1 as ScopedEngine).storage.getIntents()
    const ctxs = _.chain(intents)
      .flatMap(i => i.contexts)
      .uniq()
      .value()

    res.send(ctxs)
  })

  router.get('/entities', async (req, res) => {
    const entities = await (state.nluByBot[req.params.botId].engine1 as ScopedEngine).storage.getAvailableEntities()
    res.json(entities)
  })

  router.post('/entities', async (req, res) => {
    const { botId } = req.params
    try {
      const entityDef = (await validate(req.body, EntityDefCreateSchema, {
        stripUnknown: true
      })) as sdk.NLU.EntityDefinition
      const botEngine = state.nluByBot[botId].engine1 as ScopedEngine
      await botEngine.storage.saveEntity(entityDef)
      scheduleSyncNLU(req.params.botId)

      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).warn('Cannot create entity, invalid schema')
      res.status(400).send('Invalid schema')
    }
  })

  router.post('/entities/:id', async (req, res) => {
    const content = req.body
    const { botId, id } = req.params
    const updatedEntity = content as sdk.NLU.EntityDefinition

    const botEngine = state.nluByBot[botId].engine1 as ScopedEngine
    await botEngine.storage.saveEntity({ ...updatedEntity, id })
    scheduleSyncNLU(req.params.botId)

    res.sendStatus(200)
  })

  router.post('/entities/:id/delete', async (req, res) => {
    const { botId, id } = req.params
    const botEngine = state.nluByBot[botId].engine1 as ScopedEngine
    await botEngine.storage.deleteEntity(id)
    scheduleSyncNLU(req.params.botId)

    res.sendStatus(204)
  })

  router.post('/extract', async (req, res) => {
    const eventText = {
      preview: req.body.text,
      payload: {
        text: req.body.text
      }
    }

    try {
      const result = await state.nluByBot[req.params.botId].engine1.extract(eventText.preview, [], [])
      res.send(result)
    } catch (err) {
      res.status(500).send(`Error extracting NLU data from event: ${err}`)
    }
  })

  router.get('/ml-recommendations', async (req, res) => {
    const engine = state.nluByBot[req.params.botId].engine1 as ScopedEngine
    res.send(engine.getMLRecommendations())
  })
}
