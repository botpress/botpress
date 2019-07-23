import * as sdk from 'botpress/sdk'
import { validate } from 'joi'
import _ from 'lodash'
import ms from 'ms'

import { initializeLangServer, nluHealth } from '.'
import ConfusionEngine from './confusion-engine'
import ScopedEngine from './engine'
import { EngineByBot } from './typings'
import { EntityDefCreateSchema, IntentDefCreateSchema } from './validation'

const SYNC_INTERVAL_MS = ms('5s')

export default async (bp: typeof sdk, nlus: EngineByBot) => {
  const router = bp.http.createRouterForBot('nlu')

  const syncByBots: { [key: string]: NodeJS.Timer } = {}

  const scheduleSyncNLU = (botId: string) => {
    if (syncByBots[botId]) {
      clearTimeout(syncByBots[botId])
      delete syncByBots[botId]
    }

    syncByBots[botId] = setTimeout(() => {
      delete syncByBots[botId]
      const botEngine = nlus[botId] as ScopedEngine
      syncNLU(botEngine, false)
    }, SYNC_INTERVAL_MS)
  }

  const syncNLU = async (
    botEngine: ScopedEngine,
    confusionMode: boolean = false,
    confusionVersion: string = undefined
  ): Promise<string> => {
    const startTraining = { type: 'nlu', name: 'train', working: true, message: 'Training model' }
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', startTraining))

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

      const trainingComplete = { type: 'nlu', name: 'done', working: false, message: 'Model is up-to-date' }
      bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', trainingComplete))
    }
  }

  router.get('/health', async (req, res) => {
    // When the health is bad, we'll refresh the status in case it changed (eg: user added languages)
    if (!nluHealth.isEnabled) {
      await initializeLangServer(bp)
    }
    res.send(nluHealth)
  })

  router.get('/currentModelHash', async (req, res) => {
    const engine = nlus[req.params.botId] as ScopedEngine
    if (engine.modelHash) {
      return res.send(engine.modelHash)
    }
    const intents = await engine.storage.getIntents()
    const modelHash = await engine.computeModelHash(intents)
    res.send(modelHash)
  })

  router.get('/confusion/:modelHash/:version', async (req, res) => {
    const engine = nlus[req.params.botId] as ConfusionEngine
    const confusionComputing = engine.confusionComputing
    const lang = req.query.lang || (await sdk.bots.getBotById(req.params.botId)).defaultLanguage

    try {
      const matrix = await engine.storage.getConfusionMatrix(req.params.modelHash, req.params.version, lang)
      res.send({ matrix, confusionComputing })
    } catch (err) {
      if (err.code !== 'ENOENT') {
        bp.logger.attachError(err).warn(`Could not get confusion matrix for ${req.params.modelHash}.`)
      }
      res.send({ confusionComputing })
    }
  })

  router.get('/confusion', async (req, res) => {
    try {
      const botId = req.params.botId
      const confusions = await (nlus[botId] as ScopedEngine).storage.getAllConfusionMatrix()
      res.send({ botId, confusions })
    } catch (err) {
      res.sendStatus(500)
    }
  })

  router.post('/confusion', async (req, res) => {
    try {
      const botEngine = nlus[req.params.botId] as ScopedEngine
      const { version } = req.body
      const modelHash = await syncNLU(botEngine, true, version)
      res.send({ modelHash })
    } catch (err) {
      res.status(400).send('Could not train confusion matrix')
    }
  })

  router.get('/intents', async (req, res) => {
    res.send(await (nlus[req.params.botId] as ScopedEngine).storage.getIntents())
  })

  router.get('/intents/:intent', async (req, res) => {
    res.send(await (nlus[req.params.botId] as ScopedEngine).storage.getIntent(req.params.intent))
  })

  router.delete('/intents/:intent', async (req, res) => {
    const botEngine = nlus[req.params.botId] as ScopedEngine

    await botEngine.storage.deleteIntent(req.params.intent)
    scheduleSyncNLU(req.params.botId)

    res.sendStatus(204)
  })

  router.post('/intents', async (req, res) => {
    try {
      const intentDef = await validate(req.body, IntentDefCreateSchema, {
        stripUnknown: true
      })

      const botEngine = nlus[req.params.botId] as ScopedEngine
      await botEngine.storage.saveIntent(intentDef.name, intentDef)
      scheduleSyncNLU(req.params.botId)

      res.sendStatus(201)
    } catch (err) {
      bp.logger.attachError(err).warn('Cannot create intent, invalid schema')
      res.status(400).send('Invalid schema')
    }
  })

  // TODO use this in UI
  router.put('/intents/:id/utterances', async (req, res) => {
    const { botId, id } = req.params
    const { lang, utterances } = req.body
    const botEngine = nlus[botId] as ScopedEngine
    // TODO add validation : bot exists, intent exist, lang is supported by bot utterance is string[])

    await botEngine.storage.updateIntent(id, { utterances: { [lang]: utterances } })
  })

  router.get('/contexts', async (req, res) => {
    const botId = req.params.botId
    const filepaths = await bp.ghost.forBot(botId).directoryListing('/intents', '*.json')
    const contextsArray = await Promise.map(filepaths, async filepath => {
      const file = await bp.ghost.forBot(botId).readFileAsObject('/intents', filepath)
      return file['contexts']
    })

    // Contexts is an array of arrays that can contain duplicate values
    res.send(_.uniq(_.flatten(contextsArray)))
  })

  router.get('/entities', async (req, res) => {
    const entities = await (nlus[req.params.botId] as ScopedEngine).storage.getAvailableEntities()
    res.json(entities)
  })

  router.post('/entities', async (req, res) => {
    const { botId } = req.params
    try {
      const entityDef = (await validate(req.body, EntityDefCreateSchema, {
        stripUnknown: true
      })) as sdk.NLU.EntityDefinition

      const botEngine = nlus[botId] as ScopedEngine
      await botEngine.storage.saveEntity(entityDef)
      scheduleSyncNLU(req.params.botId)

      res.sendStatus(201)
    } catch (err) {
      bp.logger.attachError(err).warn('Cannot create entity, imvalid schema')
      res.status(400).send('Invalid schema')
    }
  })

  router.put('/entities/:id', async (req, res) => {
    const content = req.body
    const { botId, id } = req.params
    const updatedEntity = content as sdk.NLU.EntityDefinition

    const botEngine = nlus[botId] as ScopedEngine
    await botEngine.storage.saveEntity({ ...updatedEntity, id })
    scheduleSyncNLU(req.params.botId)

    res.sendStatus(201)
  })

  router.delete('/entities/:id', async (req, res) => {
    const { botId, id } = req.params
    const botEngine = nlus[botId] as ScopedEngine
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
      const result = await nlus[req.params.botId].extract(eventText.preview, [], [])
      res.send(result)
    } catch (err) {
      res.status(500).send(`Error extracting NLU data from event: ${err}`)
    }
  })

  router.get('/ml-recommendations', async (req, res) => {
    const engine = nlus[req.params.botId] as ScopedEngine
    res.send(engine.getMLRecommendations())
  })
}
