import * as sdk from 'botpress/sdk'
import { validate } from 'joi'
import _ from 'lodash'
import ms from 'ms'
import yn from 'yn'

import ConfusionEngine from './confusion-engine'
import { crossValidate } from './cross-validation'
import ScopedEngine from './engine'
import { getTrainingSession } from './engine2/train-session-service'
import { EntityDefCreateSchema } from './entities'
import { initializeLanguageProvider } from './module-lifecycle/on-server-started'
import { NLUState } from './typings'
import { IntentDefCreateSchema, PredictSchema } from './validation'

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

    syncByBots[botId] = setTimeout(async () => {
      delete syncByBots[botId]
      const botEngine = state.nluByBot[botId].engine1 as ScopedEngine
      await syncNLU(botEngine, false)
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

  router.post('/cross-validation/:lang', async (req, res) => {
    const { botId, lang } = req.params
    const botEngine = state.nluByBot[botId].engine1 as ScopedEngine
    const intentDefs = await botEngine.storage.getIntents()
    const entityDefs = await botEngine.storage.getCustomEntities()

    bp.logger.forBot(botId).info('Started cross validation')
    const xValidationRes = await crossValidate(botId, intentDefs, entityDefs, lang)
    bp.logger.forBot(botId).info('Finished cross validation')

    res.send(xValidationRes)
  })

  router.get('/training/:language', async (req, res) => {
    const { language, botId } = req.params
    const session = await getTrainingSession(bp, botId, language)
    res.send(session)
  })

  router.post('/predict', async (req, res) => {
    const { botId } = req.params
    const { error, value } = PredictSchema.validate(req.body)
    if (error) {
      return res.status(400).send('Predict body is invalid')
    }
    if (!state.nluByBot[botId]) {
      return res.status(404).send(`Bot ${botId} doesn't exist`)
    }

    try {
      const nlu = await state.nluByBot[botId].engine.predict(value.text, value.contexts)
      res.send({ nlu })
    } catch (err) {
      res.status(500).send('Could not extract nlu data')
    }
  })

  // TODO move this in intent router
  router.get('/intents', async (req, res) => {
    res.send(await (state.nluByBot[req.params.botId].engine1 as ScopedEngine).storage.getIntents())
  })

  // TODO move this in intent router
  router.get('/intents/:intent', async (req, res) => {
    res.send(await (state.nluByBot[req.params.botId].engine1 as ScopedEngine).storage.getIntent(req.params.intent))
  })

  // TODO move this in intent router
  router.post('/intents/:intent/delete', async (req, res) => {
    const botEngine = state.nluByBot[req.params.botId].engine1 as ScopedEngine

    await botEngine.storage.deleteIntent(req.params.intent)
    scheduleSyncNLU(req.params.botId)

    res.sendStatus(204)
  })

  // TODO move this in intent router
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

  // TODO move this in intent router
  router.post('/intents/:intentName', async (req, res) => {
    const botEngine = state.nluByBot[req.params.botId].engine1 as ScopedEngine
    await botEngine.storage.updateIntent(req.params.intentName, req.body)
    scheduleSyncNLU(req.params.botId)

    res.sendStatus(200)
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

  router.get('/entities/:entityName', async (req, res) => {
    res.send(
      await (state.nluByBot[req.params.botId].engine1 as ScopedEngine).storage.getCustomEntity(req.params.entityName)
    )
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
    await botEngine.storage.updateEntity(id, updatedEntity)
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

  // TODO move this in intent router
  router.get('/ml-recommendations', async (req, res) => {
    const engine = state.nluByBot[req.params.botId].engine1 as ScopedEngine
    res.send(engine.getMLRecommendations())
  })
}
